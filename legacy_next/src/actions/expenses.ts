"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";

export async function createExpense(formData: FormData) {
  await requireAnyRole(["accountant", "auditor"]);
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const occurredRaw = formData.get("occurredAt");

  if (!category || Number.isNaN(amount) || !occurredRaw) return;

  const expense = await prisma.expense.create({
    data: {
      category,
      description: description || "—",
      amount,
      occurredAt: new Date(String(occurredRaw)),
    },
  });

  await logActivity({
    action: "create",
    entity: "expense",
    entityId: expense.id,
  });
  revalidatePath("/financials");
}
