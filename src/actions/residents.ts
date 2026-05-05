"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole, requireUser } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function ensureMyProfile() {
  const user = await requireUser();
  await prisma.residentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  revalidatePath("/me");
}

export async function addOccupant(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const relation = String(formData.get("relation") ?? "").trim() || null;
  if (!name) return;

  const profile = await prisma.residentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const o = await prisma.residentOccupant.create({
    data: { profileId: profile.id, name, relation },
  });
  await logActivity({ action: "add_occupant", entity: "resident_profile", entityId: profile.id, metadata: { occupantId: o.id } });
  revalidatePath("/me");
}

export async function addVehicle(formData: FormData) {
  const user = await requireUser();
  const plate = String(formData.get("plate") ?? "").trim().toUpperCase();
  const make = String(formData.get("make") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "").trim() || null;
  if (!plate) return;

  const profile = await prisma.residentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  await prisma.residentVehicle.upsert({
    where: { profileId_plate: { profileId: profile.id, plate } },
    update: { make, color },
    create: { profileId: profile.id, plate, make, color },
  });
  await logActivity({ action: "add_vehicle", entity: "resident_profile", entityId: profile.id, metadata: { plate } });
  revalidatePath("/me");
}

export async function adminUpsertProfile(formData: FormData) {
  await requireAnyRole(["staff"]);
  const userId = String(formData.get("userId") ?? "");
  const contactAlt = String(formData.get("contactAlt") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!userId) return;

  const profile = await prisma.residentProfile.upsert({
    where: { userId },
    update: { contactAlt, notes },
    create: { userId, contactAlt, notes },
  });
  await logActivity({ action: "upsert_profile", entity: "resident_profile", entityId: profile.id });
  revalidatePath("/residents");
}

