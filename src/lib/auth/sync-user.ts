import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { prisma } from "@/lib/db";

function adminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Creates or updates Prisma `User` after Firebase has verified the ID token. */
export async function syncUserFromDecodedToken(decoded: DecodedIdToken) {
  const email = decoded.email;
  if (!email) {
    throw new Error("SIGN_IN_REQUIRES_EMAIL");
  }

  const firebaseUid = decoded.uid;
  const admins = adminEmailSet();
  const isAdminListed = admins.has(email.toLowerCase());

  const phoneFromToken =
    typeof (decoded as { phone_number?: unknown }).phone_number === "string"
      ? (decoded as { phone_number: string }).phone_number
      : undefined;

  const existing = await prisma.user.findUnique({
    where: { firebaseUid },
  });

  if (existing) {
    await prisma.user.update({
      where: { firebaseUid },
      data: {
        email,
        displayName: decoded.name ?? existing.displayName,
        phone: phoneFromToken ?? existing.phone,
        ...(existing.role === "resident" && isAdminListed
          ? { role: "admin" }
          : {}),
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      firebaseUid,
      email,
      displayName: decoded.name ?? null,
      phone: phoneFromToken ?? null,
      role: isAdminListed ? "admin" : "resident",
    },
  });
}
