"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";

export async function createBooking(formData: FormData) {
  const resource = String(formData.get("resource") ?? "").trim();
  const startsRaw = formData.get("startsAt");
  const endsRaw = formData.get("endsAt");
  const unitLabel = String(formData.get("unitLabel") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!resource || !startsRaw || !endsRaw) return;

  const startsAt = new Date(String(startsRaw));
  const endsAt = new Date(String(endsRaw));

  const b = await prisma.booking.create({
    data: {
      resource,
      startsAt,
      endsAt,
      unitLabel,
      notes,
      status: "PENDING",
    },
  });

  await logActivity({
    action: "request_booking",
    entity: "booking",
    entityId: b.id,
  });
  revalidatePath("/bookings");
}

export async function setBookingStatus(formData: FormData) {
  await requireAnyRole(["staff"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) return;

  await prisma.booking.update({ where: { id }, data: { status } });
  await logActivity({
    action: "booking_status",
    entity: "booking",
    entityId: id,
    metadata: { status },
  });
  revalidatePath("/bookings");
}
