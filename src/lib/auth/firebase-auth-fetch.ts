"use client";

/**
 * Same-origin `/api/*` requests with `Authorization: Bearer <Firebase ID token>` — matches Flutter/mobile.
 * Cookies from `exchangeFirebaseSession` still satisfy Server Components / server actions on navigations.
 */
export async function firebaseAuthFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const { getFirebaseAuth } = await import("@/lib/firebase/client");
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }
  const token = await user.getIdToken();

  const headers = new Headers(init.headers ?? undefined);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
