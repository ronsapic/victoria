"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  btnPrimaryClass,
  inputClass,
  labelClass,
} from "@/components/form-styles";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const email = String(formData.get("email") ?? "").trim();
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Reset password
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Firebase sends a reset link to your inbox when the address is known.
      </p>

      {sent ? (
        <p className="mt-6 text-sm text-green-700 dark:text-green-400">
          Check your email for the reset link.
        </p>
      ) : (
        <form action={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className={`${btnPrimaryClass} w-full`}
          >
            {pending ? "Sending…" : "Send link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="underline text-zinc-600 dark:text-zinc-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
