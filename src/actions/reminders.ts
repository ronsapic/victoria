"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function dispatchPendingReminders(formData?: FormData) {
  await requireAnyRole(["accountant"]);

  const limitRaw =
    formData?.get("limit") ?? formData?.get("batchSize") ?? "25";
  const limit = Math.max(1, Math.min(200, Number(limitRaw) || 25));

  const pending = await prisma.reminderJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  // Stub dispatcher: mark SENT without external integration yet.
  const now = new Date();
  const ids = pending.map((j) => j.id);
  if (ids.length > 0) {
    await prisma.reminderJob.updateMany({
      where: { id: { in: ids } },
      data: { status: "SENT", sentAt: now },
    });
  }

  await logActivity({
    action: "dispatch_reminders",
    entity: "reminder_job",
    metadata: { count: ids.length },
  });

  revalidatePath("/reports");
  revalidatePath("/activity");
}

export async function setReminderStatus(formData: FormData) {
  await requireAnyRole(["accountant"]);

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").toUpperCase();
  if (!id || !["PENDING", "SENT", "FAILED"].includes(status)) return;

  await prisma.reminderJob.update({
    where: { id },
    data: {
      status,
      sentAt: status === "SENT" ? new Date() : null,
    },
  });

  await logActivity({
    action: "reminder_status",
    entity: "reminder_job",
    entityId: id,
    metadata: { status },
  });

  revalidatePath("/reports");
  revalidatePath("/activity");
}

