"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

function toNumber(v: FormDataEntryValue | null) {
  if (v === null) return NaN;
  return Number(v);
}

async function recomputeInvoiceStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return null;

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoice.amount - paid;
  const now = new Date();

  const nextStatus =
    balance <= 0.0001
      ? "PAID"
      : invoice.dueDate < now
        ? "OVERDUE"
        : "PENDING";

  if (invoice.status !== nextStatus) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: nextStatus },
    });
  }

  return { paid, balance, nextStatus, dueDate: invoice.dueDate, amount: invoice.amount };
}

export async function recordPayment(formData: FormData) {
  await requireAnyRole(["accountant"]);

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amount = toNumber(formData.get("amount"));
  const method = String(formData.get("method") ?? "").toUpperCase();
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const receivedRaw = formData.get("receivedAt");

  if (!invoiceId || Number.isNaN(amount) || amount <= 0) return;
  if (!["MOBILE_MONEY", "BANK", "CASH", "ADJUSTMENT"].includes(method)) return;

  const receivedAt = receivedRaw ? new Date(String(receivedRaw)) : new Date();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true, unit: true },
  });
  if (!invoice) return;

  await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method,
      reference,
      receivedAt,
    },
  });
  const after = await recomputeInvoiceStatus(invoiceId);
  const isSettled = after ? after.balance <= 0.0001 : false;

  await logActivity({
    action: "record_payment",
    entity: "invoice",
    entityId: invoiceId,
    metadata: { amount, method, reference, isSettled },
  });

  revalidatePath("/payments");
  revalidatePath(`/units/${invoice.unitId}`);
  revalidatePath("/reports");
}

/** Creates a reversing adjustment (negative payment) instead of deleting history. */
export async function reversePayment(formData: FormData) {
  await requireAnyRole(["accountant"]);

  const paymentId = String(formData.get("paymentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "reversal";
  if (!paymentId) return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true },
  });
  if (!payment) return;

  await prisma.payment.create({
    data: {
      invoiceId: payment.invoiceId,
      amount: -Math.abs(payment.amount),
      method: "ADJUSTMENT",
      reference: `REVERSAL:${payment.id}:${reason}`.slice(0, 200),
      receivedAt: new Date(),
    },
  });

  const after = await recomputeInvoiceStatus(payment.invoiceId);

  await logActivity({
    action: "reverse_payment",
    entity: "invoice",
    entityId: payment.invoiceId,
    metadata: { paymentId, reason, nextStatus: after?.nextStatus },
  });

  revalidatePath("/payments");
  revalidatePath(`/payments/${payment.invoiceId}`);
  revalidatePath("/reports");
}

/**
 * Takes a lump sum for a Unit and allocates it to oldest open invoices first.
 * Records one Payment per invoice allocation.
 */
export async function allocatePaymentToUnit(formData: FormData) {
  await requireAnyRole(["accountant"]);

  const unitId = String(formData.get("unitId") ?? "");
  const amountIn = toNumber(formData.get("amount"));
  const method = String(formData.get("method") ?? "").toUpperCase();
  const reference = String(formData.get("reference") ?? "").trim() || null;

  if (!unitId || Number.isNaN(amountIn) || amountIn <= 0) return;
  if (!["MOBILE_MONEY", "BANK", "CASH", "ADJUSTMENT"].includes(method)) return;

  const open = await prisma.invoice.findMany({
    where: { unitId, status: { in: ["PENDING", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
    include: { payments: true },
    take: 100,
  });
  if (open.length === 0) return;

  let remaining = amountIn;
  const allocations: Array<{ invoiceId: string; amount: number }> = [];

  for (const inv of open) {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    const bal = Math.max(0, inv.amount - paid);
    if (bal <= 0.0001) continue;

    const pay = Math.min(remaining, bal);
    if (pay <= 0) break;
    allocations.push({ invoiceId: inv.id, amount: pay });
    remaining -= pay;
    if (remaining <= 0.0001) break;
  }

  if (allocations.length === 0) return;

  const receivedAt = new Date();
  await prisma.$transaction(async (tx) => {
    for (const a of allocations) {
      await tx.payment.create({
        data: {
          invoiceId: a.invoiceId,
          amount: a.amount,
          method,
          reference,
          receivedAt,
        },
      });
    }
  });

  for (const a of allocations) {
    await recomputeInvoiceStatus(a.invoiceId);
  }

  await logActivity({
    action: "allocate_payment",
    entity: "unit",
    entityId: unitId,
    metadata: { amountIn, method, reference, allocations, remaining },
  });

  revalidatePath("/payments");
  revalidatePath(`/units/${unitId}`);
  revalidatePath("/reports");
}

