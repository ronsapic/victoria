"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { firebaseAuthFetch } from "@/lib/auth/firebase-auth-fetch";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { btnGhostClass } from "@/components/form-styles";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await firebaseAuthFetch("/api/auth/session", { method: "DELETE" });
      await signOut(await getFirebaseAuth());
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className={btnGhostClass}
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}
