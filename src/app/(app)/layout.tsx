import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthHeader } from "@/components/auth-header";
import Image from "next/image";

/** Always read fresh totals from SQLite in dev; swap provider in production hosting. */
export const dynamic = "force-dynamic";

export default async function AppSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950 lg:flex-row">
      <AppSidebar userRole={user.role} />
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/logo.png"
                alt="Victoria Place logo"
                width={28}
                height={28}
                className="rounded bg-white object-contain"
                priority
              />
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Victoria Place Association
                </h1>
              </div>
            </div>
            <AuthHeader
              email={user.email}
              displayName={user.displayName}
              role={user.role}
            />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
