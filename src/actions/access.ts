"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { USER_ROLES, type UserRole } from "@/lib/rbac";

function parseRole(role: string): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : "resident";
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

