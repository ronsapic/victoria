"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createEmergencyContact(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 0);

  if (!label || !phone) return;

  await prisma.emergencyContact.create({
    data: {
      label,
      phone,
      priority: Number.isFinite(priority) ? priority : 0,
    },
  });

  await logActivity({ action: "add_emergency_contact", entity: "emergency" });
  revalidatePath("/emergency");
}

/** Records a resident panic signal (no auth yet — wire to real user later). */
export async function triggerPanicAlert(formData: FormData) {
  const note = String(formData.get("note") ?? "").trim();
  const unitLabel = String(formData.get("unitLabel") ?? "").trim();

  await logActivity({
    action: "panic_alert",
    entity: "emergency",
    metadata: { note, unitLabel },
  });
  revalidatePath("/emergency");
  revalidatePath("/activity");
}

/** Placeholder for mass broadcast — logs only until SMS/push is integrated. */
export async function emergencyBroadcast(formData: FormData) {
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  await logActivity({
    action: "emergency_broadcast",
    entity: "emergency",
    metadata: { message },
  });
  revalidatePath("/emergency");
  revalidatePath("/activity");
}
