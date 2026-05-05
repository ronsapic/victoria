"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "PLANNED").trim();
  const timelineNote =
    String(formData.get("timelineNote") ?? "").trim() || undefined;

  if (!name) return;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      status,
      timelineNote,
    },
  });

  await logActivity({
    action: "create_project",
    entity: "project",
    entityId: project.id,
  });
  revalidatePath("/projects");
}

export async function updateProjectStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const timelineNote =
    String(formData.get("timelineNote") ?? "").trim() || null;

  if (!id || !status) return;

  await prisma.project.update({
    where: { id },
    data: { status, timelineNote },
  });

  await logActivity({
    action: "project_update",
    entity: "project",
    entityId: id,
  });
  revalidatePath("/projects");
}
