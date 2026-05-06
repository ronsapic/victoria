"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";

export async function createIncident(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "General";
  const unitId = String(formData.get("unitId") ?? "").trim() || null;

  if (!title || !description) return;

  const inc = await prisma.incident.create({
    data: {
      title,
      description,
      category,
      status: "OPEN",
      unitId,
    },
  });

  await logActivity({
    action: "create",
    entity: "incident",
    entityId: inc.id,
  });
  revalidatePath("/incidents");
}

export async function updateIncidentStatus(formData: FormData) {
  await requireAnyRole(["staff"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const assigneeRaw = String(formData.get("assignee") ?? "").trim();
  const assignee = assigneeRaw.length > 0 ? assigneeRaw : undefined;
  if (!id || !status) return;

  await prisma.incident.update({
    where: { id },
    data: { status, assignee },
  });

  await logActivity({
    action: "status_change",
    entity: "incident",
    entityId: id,
    metadata: { status },
  });
  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
}

export async function addIncidentComment(formData: FormData) {
  const incidentId = String(formData.get("incidentId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const authorRole = String(formData.get("authorRole") ?? "resident");

  if (!incidentId || !body) return;

  await prisma.incidentComment.create({
    data: { incidentId, body, authorRole },
  });

  await logActivity({
    action: "comment",
    entity: "incident",
    entityId: incidentId,
  });
  revalidatePath(`/incidents/${incidentId}`);
}
