import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { syncUserFromDecodedToken } from "@/lib/auth/sync-user";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";
import { getAdminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** Session cookie lifetime (Firebase allows up to 14 days). */
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { idToken?: string };
    const idToken = body.idToken;
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const admin = getAdminAuth();
    const decoded = await admin.verifyIdToken(idToken);
    await syncUserFromDecodedToken(decoded);

    const sessionCookie = await admin.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const jar = await cookies();
    jar.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Auth failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE_NAME)?.value;

  if (session) {
    try {
      const admin = getAdminAuth();
      const decoded = await admin.verifySessionCookie(session, true);
      await admin.revokeRefreshTokens(decoded.uid);
    } catch {
      /* cookie may be expired */
    }
  }

  jar.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
