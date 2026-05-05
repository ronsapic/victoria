"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createComplianceDoc(formData: FormData) {
  await requireAnyRole(["auditor"]);
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!title || !category) return;

  const d = await prisma.complianceDocument.create({
    data: { title, category, reference, notes },
  });
  await logActivity({ action: "create", entity: "compliance_doc", entityId: d.id });
  revalidatePath("/compliance");
}

export async function createDeadline(formData: FormData) {
  await requireAnyRole(["auditor"]);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDateRaw = formData.get("dueDate");
  if (!title || !dueDateRaw) return;

  const row = await prisma.complianceDeadline.create({
    data: { title, description, dueDate: new Date(String(dueDateRaw)) },
  });
  await logActivity({ action: "create", entity: "compliance_deadline", entityId: row.id });
  revalidatePath("/compliance");
}

export async function markDeadlineDone(formData: FormData) {
  await requireAnyRole(["auditor"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.complianceDeadline.update({ where: { id }, data: { status: "DONE" } });
  await logActivity({ action: "done", entity: "compliance_deadline", entityId: id });
  revalidatePath("/compliance");
}

