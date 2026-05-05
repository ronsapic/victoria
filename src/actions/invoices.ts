"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";

export async function createInvoice(formData: FormData) {
  await requireAnyRole(["accountant"]);
  const unitId = String(formData.get("unitId") ?? "");
  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const dueRaw = formData.get("dueDate");
  const status = String(formData.get("status") ?? "PENDING").trim();

  if (!unitId || !periodLabel || Number.isNaN(amount) || !dueRaw)
    return;

  const dueDate = new Date(String(dueRaw));
  const inv = await prisma.invoice.create({
    data: {
      unitId,
      periodLabel,
      amount,
      status,
      dueDate,
    },
  });

  await logActivity({
    action: "create",
    entity: "invoice",
    entityId: inv.id,
  });
  revalidatePath("/payments");
}

export async function setInvoiceStatus(formData: FormData) {
  await requireAnyRole(["accountant"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  await prisma.invoice.update({ where: { id }, data: { status } });
  await logActivity({
    action: "invoice_status",
    entity: "invoice",
    entityId: id,
    metadata: { status },
  });
  revalidatePath("/payments");
}
