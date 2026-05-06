import type { AuthUser } from "@/lib/auth/session";
import type { StoredFile } from "@prisma/client";

const ELEVATED_ROLES: ReadonlySet<string> = new Set([
  "admin",
  "auditor",
  "accountant",
  "staff",
]);

/** Inline / attachment view (images/PDFs in browser). */
export function canViewStoredFile(
  user: AuthUser,
  f: Pick<StoredFile, "visibility" | "category" | "uploadedById">,
): boolean {
  if (f.visibility === "RESIDENTS") return true;
  if (ELEVATED_ROLES.has(user.role)) return true;
  if (f.category === "RECEIPT" && f.uploadedById === user.id) return true;
  return false;
}

/** Download attachment (stricter than view for legacy PRIVATE docs). */
export function canDownloadStoredFile(
  user: AuthUser,
  f: Pick<StoredFile, "visibility" | "category" | "uploadedById">,
): boolean {
  if (f.visibility === "RESIDENTS") return true;
  if (user.role === "admin" || user.role === "auditor" || user.role === "accountant") {
    return true;
  }
  if (user.role === "staff") return true;
  if (f.category === "RECEIPT" && f.uploadedById === user.id) return true;
  return false;
}

export const COMMITTEE_ROLES: readonly string[] = [
  "admin",
  "auditor",
  "accountant",
];

export function isCommitteeRole(role: string): boolean {
  return COMMITTEE_ROLES.includes(role);
}
