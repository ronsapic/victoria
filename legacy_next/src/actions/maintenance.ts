"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";

export async function createMaintenanceTicket(formData: FormData) {
  await requireAnyRole(["staff"]);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unitId = String(formData.get("unitId") ?? "").trim() || null;
  if (!title || !description) return;

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      title,
      description,
      status: "OPEN",
      unitId,
    },
  });

  await logActivity({
    action: "create",
    entity: "maintenance_ticket",
    entityId: ticket.id,
  });
  revalidatePath("/maintenance");
}

export async function updateMaintenanceTicket(formData: FormData) {
  await requireAnyRole(["staff"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const contractor = String(formData.get("contractor") ?? "").trim() || null;
  const costEstimateRaw = formData.get("costEstimate");
  const costActualRaw = formData.get("costActual");
  const completed = String(formData.get("markComplete") ?? "") === "on";

  if (!id || !status) return;

  await prisma.maintenanceTicket.update({
    where: { id },
    data: {
      status,
      contractor,
      costEstimate:
        costEstimateRaw === "" || costEstimateRaw === null
          ? null
          : Number(costEstimateRaw),
      costActual:
        costActualRaw === "" || costActualRaw === null
          ? null
          : Number(costActualRaw),
      completedAt: completed ? new Date() : null,
    },
  });

  await logActivity({
    action: "update",
    entity: "maintenance_ticket",
    entityId: id,
  });
  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/${id}`);
}

export async function deleteMaintenanceTicket(formData: FormData) {
  await requireAnyRole(["staff"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.maintenanceTicket.delete({ where: { id } });
  await logActivity({
    action: "delete",
    entity: "maintenance_ticket",
    entityId: id,
  });
  revalidatePath("/maintenance");
  redirect("/maintenance");
}
