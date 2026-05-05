"use client";

import type { User } from "firebase/auth";

/** Server sets httpOnly session cookie from Firebase ID token (Admin SDK). */
export async function exchangeFirebaseSession(user: User) {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not create session");
  }
}
