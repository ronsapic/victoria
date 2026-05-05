import "server-only";

import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/rbac";
import { getSessionUser } from "@/lib/auth/session";

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAnyRole(roles: readonly UserRole[]) {
  const user = await requireUser();
  if (user.role === "admin") return user;
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export async function requireRole(role: UserRole) {
  return requireAnyRole([role]);
}

