import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { ROLE_LABELS } from "@/lib/rbac";
import type { UserRole } from "@/lib/rbac";
import { formatCurrencyTZS } from "@/lib/format";
import { getDashboardSummary } from "@/lib/dashboard-stats";
import { getSessionUser } from "@/lib/auth/session";

const quickModules = ["payments", "incidents", "water", "voting"] as const satisfies readonly (keyof typeof MODULES)[];

function canSeeBuildingFinance(role: UserRole) {
  return (
    role === "admin" || role === "accountant" || role === "auditor"
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardSummary();
  const sessionUser = await getSessionUser();
  const finance = sessionUser ? canSeeBuildingFinance(sessionUser.role) : false;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Analytics dashboard
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Overview of key activity and finance metrics for your access level.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Revenue recorded (MTD)",
            value: finance ? formatCurrencyTZS(stats.revenueMtd) : "—",
            masked: !finance,
          },
          {
            label: "Outstanding charges",
            value: finance ? formatCurrencyTZS(stats.arrearsTotal) : "—",
            masked: !finance,
          },
          {
            label: "Open incidents",
            value: String(stats.openIncidents),
            masked: false,
          },
          {
            label: "Active maintenance",
            value: String(stats.activeMaint),
            masked: false,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {card.value}
            </p>
            {card.masked && (
              <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                Treasurer view only — accountants, auditors & committee roles.
              </p>
            )}
          </div>
        ))}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Quick links
        </h3>
        <div className="flex flex-wrap gap-2">
          {quickModules
            .filter(
              (key) =>
                sessionUser &&
                (sessionUser.role === "admin" ||
                  MODULES[key].primaryFor.includes(sessionUser.role)),
            )
            .map((key) => {
              const m = MODULES[key];
              return (
                <Link
                  key={key}
                  href={m.path}
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {m.title}
                </Link>
              );
            })}
        </div>
      </section>

      {sessionUser && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Your access level
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as <strong>{ROLE_LABELS[sessionUser.role]}</strong>.
          </p>
        </section>
      )}
    </div>
  );
}
