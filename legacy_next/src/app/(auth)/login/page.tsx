import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <Suspense
      fallback={
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
