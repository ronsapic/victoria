"use client";

import type { User } from "firebase/auth";

import { firebaseAuthFetch } from "@/lib/auth/firebase-auth-fetch";
import { getFirebaseAuth } from "@/lib/firebase/client";

/** Sets httpOnly session cookie — server reads the same `Authorization: Bearer` token as mobile clients. */
export async function exchangeFirebaseSession(user: User) {
  const auth = await getFirebaseAuth();
  if (auth.currentUser?.uid !== user.uid) {
    throw new Error("Session mismatch");
  }
  const res = await firebaseAuthFetch("/api/auth/session", {
    method: "POST",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not create session");
  }
}
