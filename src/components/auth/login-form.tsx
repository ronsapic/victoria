"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { exchangeFirebaseSession } from "@/lib/auth/exchange-session";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  btnPrimaryClass,
  inputClass,
  labelClass,
} from "@/components/form-styles";

function safeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = safeReturnPath(searchParams.get("from"));

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const cred = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password,
      );
      await exchangeFirebaseSession(cred.user);
      router.push(from);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Firebase Auth — email and password. Phone OTP can be added next.
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
            autoComplete="current-password"
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
          {pending ? "Signing in…" : "Continue"}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/forgot-password" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
          Forgot password?
        </Link>
        <span>
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Create one
          </Link>
        </span>
      </div>
    </div>
  );
}
