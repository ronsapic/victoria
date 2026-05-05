"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createParkingSlot(formData: FormData) {
  await requireAnyRole(["staff"]);
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!code) return;
  const s = await prisma.parkingSlot.create({ data: { code, note } });
  await logActivity({ action: "create", entity: "parking_slot", entityId: s.id });
  revalidatePath("/parking");
}

export async function assignParking(formData: FormData) {
  await requireAnyRole(["staff"]);
  const slotId = String(formData.get("slotId") ?? "");
  const unitId = String(formData.get("unitId") ?? "") || null;
  const vehiclePlate = String(formData.get("vehiclePlate") ?? "").trim().toUpperCase() || null;
  if (!slotId) return;
  const a = await prisma.parkingAssignment.create({
    data: { slotId, unitId, vehiclePlate },
  });
  await logActivity({ action: "assign", entity: "parking_slot", entityId: slotId, metadata: { assignmentId: a.id } });
  revalidatePath("/parking");
}

export async function logViolation(formData: FormData) {
  await requireAnyRole(["staff"]);
  const vehiclePlate = String(formData.get("vehiclePlate") ?? "").trim().toUpperCase();
  const slotId = String(formData.get("slotId") ?? "") || null;
  const unitLabel = String(formData.get("unitLabel") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!vehiclePlate) return;
  const v = await prisma.parkingViolation.create({
    data: { vehiclePlate, slotId, unitLabel, note },
  });
  await logActivity({ action: "violation", entity: "parking", entityId: v.id });
  revalidatePath("/parking");
}

