"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";

import { requireAnyRole } from "@/lib/auth/require-role";
import { requireUser } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { getAdminAuth } from "@/lib/firebase/admin";
import { USER_ROLES, type UserRole } from "@/lib/rbac";

function parseRole(role: string): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : "resident";
}

function randomPassword(): string {
  // Firebase requires >= 6 chars; we generate a strong temporary password.
  return crypto.randomBytes(24).toString("base64url");
}

export async function setUserRole(formData: FormData) {
  await requireAnyRole(["admin"]);

  const userId = String(formData.get("userId") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  if (!userId) return;
  const role = parseRole(roleRaw);

  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logActivity({
    action: "set_role",
    entity: "user",
    entityId: userId,
    metadata: { role },
  });

  revalidatePath("/access");
  revalidatePath("/activity");
}

export async function createUser(formData: FormData) {
  await requireAnyRole(["admin"]);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const roleRaw = String(formData.get("role") ?? "");

  if (!email || !email.includes("@")) return;
  const role = parseRole(roleRaw);

  const existing = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (existing) return;

  const admin = getAdminAuth();
  const fbUser = await admin.createUser({
    email,
    displayName: displayName ?? undefined,
    password: randomPassword(),
    emailVerified: false,
    disabled: false,
  });

  const row = await prisma.user.create({
    data: {
      firebaseUid: fbUser.uid,
      email,
      displayName,
      role,
    },
  });

  await logActivity({
    action: "create",
    entity: "user",
    entityId: row.id,
    metadata: { email, role, firebaseUid: fbUser.uid },
  });

  revalidatePath("/access");
  revalidatePath("/activity");
}

export async function deleteUser(formData: FormData) {
  await requireAnyRole(["admin"]);
  const sessionUser = await requireUser();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  if (userId === sessionUser.id) return;

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { firebaseUid: true, email: true },
  });
  if (!row) return;

  // Delete from Prisma first (cascades); then remove from Firebase Auth.
  await prisma.user.delete({ where: { id: userId } });

  try {
    const admin = getAdminAuth();
    await admin.deleteUser(row.firebaseUid);
  } catch {
    // If Firebase user was already deleted, keep Prisma consistent.
  }

  await logActivity({
    action: "delete",
    entity: "user",
    entityId: userId,
    metadata: { email: row.email, firebaseUid: row.firebaseUid },
  });

  revalidatePath("/access");
  revalidatePath("/activity");
}

export async function addUnitMembership(formData: FormData) {
  await requireAnyRole(["admin"]);

  const unitId = String(formData.get("unitId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const kind = String(formData.get("kind") ?? "").toUpperCase();
  if (!unitId || !userId || (kind !== "OWNER" && kind !== "TENANT")) return;

  await prisma.unitMembership.create({
    data: { unitId, userId, kind, startDate: new Date() },
  });

  await logActivity({
    action: "add_membership",
    entity: "unit",
    entityId: unitId,
    metadata: { userId, kind },
  });

  revalidatePath("/access");
  revalidatePath(`/units/${unitId}`);
}

export async function endMembership(formData: FormData) {
  await requireAnyRole(["admin"]);

  const id = String(formData.get("membershipId") ?? "");
  if (!id) return;

  const row = await prisma.unitMembership.update({
    where: { id },
    data: { endDate: new Date() },
  });

  await logActivity({
    action: "end_membership",
    entity: "unit",
    entityId: row.unitId,
    metadata: { membershipId: id },
  });

  revalidatePath("/access");
  revalidatePath(`/units/${row.unitId}`);
}

