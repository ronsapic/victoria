/** Role model from product spec §1 — wire to auth/session later. */
export const USER_ROLES = [
  "admin",
  "accountant",
  "resident",
  "staff",
  "auditor",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin (Committee)",
  accountant: "Accountant",
  resident: "Resident",
  staff: "Caretaker / Staff",
  auditor: "Auditor",
};
