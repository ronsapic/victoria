"use client";

import type { UserRole } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/rbac";

import { SignOutButton } from "@/components/auth/sign-out-button";

export function AuthHeader({
  email,
  displayName,
  role,
}: {
  email: string;
  displayName: string | null;
  role: UserRole;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-right">
      <div>
        <p className="text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-50">
          {displayName || email}
        </p>
        <p className="text-xs text-zinc-500">
          {ROLE_LABELS[role]} · <span className="font-mono">{email}</span>
        </p>
      </div>
      <SignOutButton />
    </div>
  );
}
