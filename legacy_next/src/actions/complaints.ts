"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole, requireUser } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createComplaint(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const unitId = String(formData.get("unitId") ?? "").trim() || null;
  if (!title || !body) return;

  const c = await prisma.complaint.create({
    data: {
      title,
      body,
      unitId,
      createdById: user.id,
      status: "OPEN",
    },
  });

  await logActivity({ action: "create", entity: "complaint", entityId: c.id });
  revalidatePath("/communications");
}

export async function addComplaintComment(formData: FormData) {
  const user = await requireUser();
  const complaintId = String(formData.get("complaintId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!complaintId || !body) return;

  const authorRole = user.role;
  await prisma.complaintComment.create({
    data: { complaintId, body, authorRole },
  });

  await logActivity({
    action: "comment",
    entity: "complaint",
    entityId: complaintId,
  });
  revalidatePath(`/communications/${complaintId}`);
}

export async function updateComplaintStatus(formData: FormData) {
  await requireAnyRole(["staff"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").toUpperCase();
  if (!id || !["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) return;

  await prisma.complaint.update({ where: { id }, data: { status } });
  await logActivity({
    action: "status_change",
    entity: "complaint",
    entityId: id,
    metadata: { status },
  });
  revalidatePath("/communications");
  revalidatePath(`/communications/${id}`);
}

