import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import type { UserRole } from "@/lib/rbac";
import { USER_ROLES } from "@/lib/rbac";

import { prisma } from "@/lib/db";

import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";

export type AuthUser = {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
};

function parseRole(r: string): UserRole {
  return USER_ROLES.includes(r as UserRole) ? (r as UserRole) : "resident";
}

async function resolveFirebaseUid(): Promise<string | null> {
  const hdrs = await headers();
  const authorization = hdrs.get("authorization")?.trim();

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const idToken = authorization.slice(7).trim();
    if (!idToken) return null;

    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      return decoded.uid;
    } catch {
      return null;
    }
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function readSession(): Promise<AuthUser | null> {
  const firebaseUid = await resolveFirebaseUid();
  if (!firebaseUid) return null;

  try {
    const row = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!row) return null;

    return {
      id: row.id,
      firebaseUid: row.firebaseUid,
      email: row.email,
      displayName: row.displayName ?? null,
      role: parseRole(row.role),
    };
  } catch {
    return null;
  }
}

/** Per-request dedupe when layout + pages both need the signed-in user. */
export const getSessionUser = cache(readSession);
