"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createSchedule(formData: FormData) {
  await requireAnyRole(["staff"]);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const intervalDays = Number(formData.get("intervalDays"));
  const nextRunAtRaw = formData.get("nextRunAt");
  const unitId = String(formData.get("unitId") ?? "").trim() || null;
  const assetId = String(formData.get("assetId") ?? "").trim() || null;
  const assignee = String(formData.get("assignee") ?? "").trim() || null;

  if (!title || Number.isNaN(intervalDays) || intervalDays <= 0 || !nextRunAtRaw) return;

  const s = await prisma.maintenanceSchedule.create({
    data: {
      title,
      description,
      intervalDays,
      nextRunAt: new Date(String(nextRunAtRaw)),
      unitId,
      assetId,
      assignee,
    },
  });

  await logActivity({ action: "create", entity: "maintenance_schedule", entityId: s.id });
  revalidatePath("/maintenance");
}

export async function toggleSchedule(formData: FormData) {
  await requireAnyRole(["staff"]);
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  await prisma.maintenanceSchedule.update({ where: { id }, data: { active } });
  await logActivity({ action: "toggle", entity: "maintenance_schedule", entityId: id, metadata: { active } });
  revalidatePath("/maintenance");
}

