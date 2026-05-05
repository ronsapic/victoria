"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole, requireUser } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function attachFileToIncident(formData: FormData) {
  const user = await requireUser();

  const incidentId = String(formData.get("incidentId") ?? "");
  const fileId = String(formData.get("fileId") ?? "");
  if (!incidentId || !fileId) return;

  // Residents can only attach to incidents they can see (no unit scoping yet in incident model),
  // so keep attachment role-restricted until we wire full author tracking.
  if (user.role === "resident") {
    await requireAnyRole(["staff"]);
  }

  await prisma.incidentAttachment.create({
    data: { incidentId, fileId },
  });

  await logActivity({
    action: "attach_file",
    entity: "incident",
    entityId: incidentId,
    metadata: { fileId },
  });

  revalidatePath(`/incidents/${incidentId}`);
}

