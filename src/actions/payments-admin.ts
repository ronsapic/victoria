"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function bulkMarkOverdue() {
  await requireAnyRole(["accountant"]);

  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: {
      status: "PENDING",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  await logActivity({
    action: "bulk_overdue",
    entity: "invoice",
    metadata: { count: result.count },
  });

  revalidatePath("/payments");
  revalidatePath("/reports");
}

export async function applyLatePenalty(formData: FormData) {
  await requireAnyRole(["accountant"]);

  const unitId = String(formData.get("unitId") ?? "");
  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const baseAmount = Number(formData.get("baseAmount"));
  const pct = Number(formData.get("penaltyPct") ?? 2);

  if (!unitId || !periodLabel || Number.isNaN(baseAmount) || Number.isNaN(pct)) return;

  const amount = Math.max(0, (baseAmount * pct) / 100);
  if (amount <= 0) return;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const inv = await prisma.invoice.create({
    data: {
      unitId,
      periodLabel: `${periodLabel} (Penalty)`,
      amount,
      status: "PENDING",
      dueDate,
    },
  });

  await logActivity({
    action: "penalty",
    entity: "unit",
    entityId: unitId,
    metadata: { invoiceId: inv.id, pct, amount },
  });

  revalidatePath("/payments");
  revalidatePath("/reports");
}

export async function enqueueReminder(formData: FormData) {
  await requireAnyRole(["accountant"]);

  const unitId = String(formData.get("unitId") ?? "");
  const channel = String(formData.get("channel") ?? "EMAIL").toUpperCase();
  if (!unitId || (channel !== "EMAIL" && channel !== "SMS")) return;

  const openInvoices = await prisma.invoice.findMany({
    where: { unitId, status: { in: ["PENDING", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
  });

  if (openInvoices.length === 0) return;

  const payload = {
    unitId,
    openCount: openInvoices.length,
    total: openInvoices.reduce((s, i) => s + i.amount, 0),
    soonestDue: openInvoices[0]!.dueDate.toISOString(),
  };

  const job = await prisma.reminderJob.create({
    data: {
      unitId,
      channel,
      template: "SERVICE_CHARGE_REMINDER",
      payload,
    },
  });

  await logActivity({
    action: "enqueue_reminder",
    entity: "reminder_job",
    entityId: job.id,
    metadata: { unitId, channel },
  });

  revalidatePath("/reports");
}

