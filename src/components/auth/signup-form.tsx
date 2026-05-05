"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { exchangeFirebaseSession } from "@/lib/auth/exchange-session";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  btnPrimaryClass,
  inputClass,
  labelClass,
} from "@/components/form-styles";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password,
      );
      await exchangeFirebaseSession(cred.user);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create account
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        New residents self-register as <strong>Resident</strong>. Committee
        promotes accounts via <code className="text-xs">ADMIN_EMAILS</code> or
        direct DB role updates.
      </p>

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
        <div>
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
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
          {pending ? "Creating…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
