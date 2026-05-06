import Link from "next/link";
import { ModuleHeader } from "@/components/module-header";
import { cardClass } from "@/components/form-styles";
import { prisma } from "@/lib/db";
import { formatCurrencyTZS } from "@/lib/format";
import { requireAnyRole } from "@/lib/auth/require-role";
import {
  bulkMarkOverdue,
  enqueueReminder,
  applyLatePenalty,
} from "@/actions/payments-admin";
import { dispatchPendingReminders, setReminderStatus } from "@/actions/reminders";

export default async function ReportsPage() {
  await requireAnyRole(["accountant", "auditor"]);

  const [charges, arrearsAgg] = await Promise.all([
    prisma.invoice.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const [defaulters, reminderJobs] = await Promise.all([
    prisma.unit.findMany({
    where: {
      invoices: { some: { status: { in: ["PENDING", "OVERDUE"] } } },
    },
    orderBy: { number: "asc" },
    include: {
      invoices: {
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
      },
    },
    take: 200,
  }),
    prisma.reminderJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="reports" />

      <div className="grid gap-4 md:grid-cols-3">
        {charges.map((g) => (
          <div key={g.status} className={cardClass}>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Invoices ({g.status.toLowerCase()})
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrencyTZS(g._sum.amount ?? 0)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">{g._count} rows</p>
          </div>
        ))}
      </div>

      <div className={cardClass}>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Exposure snapshot
        </p>
        <p className="mt-4 text-xl font-semibold text-orange-700 dark:text-orange-300">
          {formatCurrencyTZS(arrearsAgg._sum.amount ?? 0)}{" "}
          <span className="text-sm font-normal text-zinc-500">
            unresolved across {arrearsAgg._count} mandates
          </span>
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              Defaulters list
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Units with pending/overdue invoices. Use bulk actions to keep
              statuses current.
            </p>
          </div>
          <form action={bulkMarkOverdue}>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Mark PENDING past due as OVERDUE
            </button>
          </form>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-zinc-800 dark:text-zinc-200">
            <thead>
              <tr>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Unit
                </th>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Open invoices
                </th>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Total due
                </th>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {defaulters.map((u) => {
                const total = u.invoices.reduce((s, i) => s + i.amount, 0);
                const oldest = u.invoices[0];
                return (
                  <tr key={u.id}>
                    <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                      <Link href={`/units/${u.id}`} className="underline">
                        {u.number}
                      </Link>
                      <span className="block text-xs text-zinc-500">
                        oldest due: {oldest ? oldest.dueDate.toDateString() : "—"}
                      </span>
                    </td>
                    <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                      {u.invoices.length}
                    </td>
                    <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                      {formatCurrencyTZS(total)}
                    </td>
                    <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                      <div className="flex flex-wrap gap-2">
                        <form action={enqueueReminder}>
                          <input type="hidden" name="unitId" value={u.id} />
                          <input type="hidden" name="channel" value="EMAIL" />
                          <button
                            type="submit"
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                          >
                            Queue email reminder
                          </button>
                        </form>
                        <form action={enqueueReminder}>
                          <input type="hidden" name="unitId" value={u.id} />
                          <input type="hidden" name="channel" value="SMS" />
                          <button
                            type="submit"
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                          >
                            Queue SMS reminder
                          </button>
                        </form>
                        <form action={applyLatePenalty} className="flex items-center gap-2">
                          <input type="hidden" name="unitId" value={u.id} />
                          <input
                            type="hidden"
                            name="periodLabel"
                            value={oldest?.periodLabel ?? "Penalty"}
                          />
                          <input type="hidden" name="baseAmount" value={total} />
                          <input
                            name="penaltyPct"
                            defaultValue={2}
                            className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                          />
                          <span className="text-xs text-zinc-500">%</span>
                          <button
                            type="submit"
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                          >
                            Add penalty
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {defaulters.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-zinc-500" colSpan={4}>
                    No outstanding invoices.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              Reminder queue
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Jobs queued from the Defaulters table. Dispatch currently marks
              jobs as sent (wire SMS/Email later).
            </p>
          </div>
          <form action={dispatchPendingReminders} className="flex items-center gap-2">
            <input
              name="limit"
              defaultValue={25}
              className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Dispatch pending
            </button>
          </form>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-zinc-800 dark:text-zinc-200">
            <thead>
              <tr>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Created
                </th>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Unit
                </th>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Channel
                </th>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Template
                </th>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Status
                </th>
                <th className="border-b border-zinc-200 pb-2 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                  Ops
                </th>
              </tr>
            </thead>
            <tbody>
              {reminderJobs.map((j) => (
                <tr key={j.id}>
                  <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                    {j.createdAt.toLocaleString()}
                  </td>
                  <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                    <Link href={`/units/${j.unitId}`} className="underline">
                      {j.unitId}
                    </Link>
                  </td>
                  <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                    {j.channel}
                  </td>
                  <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                    {j.template}
                  </td>
                  <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                    {j.status}
                  </td>
                  <td className="border-b border-zinc-100 py-3 pr-4 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-2">
                      <form action={setReminderStatus}>
                        <input type="hidden" name="id" value={j.id} />
                        <input type="hidden" name="status" value="PENDING" />
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                        >
                          Requeue
                        </button>
                      </form>
                      <form action={setReminderStatus}>
                        <input type="hidden" name="id" value={j.id} />
                        <input type="hidden" name="status" value="FAILED" />
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                        >
                          Mark failed
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {reminderJobs.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-zinc-500" colSpan={6}>
                    No reminder jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <ExportCard
          title="Defaulters CSV"
          subtitle="Download current outstanding list"
          href="/api/reports/defaulters.csv"
        />
        <ExportCard
          title="Defaulters PDF"
          subtitle="Printable outstanding list"
          href="/api/reports/defaulters.pdf"
        />
        <ExportCard title="Finance PDF pack" subtitle="Rolling income / expense appendix" />
        <ExportCard title="Operational digest" subtitle="Incident + upkeep chronology" />
        <ExportCard title="Compliance audit set" subtitle="Votes, letters, SOS trail" />
      </section>

      <p className="text-xs text-zinc-500">
        Download buttons hook to queued jobs (`next/response` blobs or worker) —
        groundwork data already lives in relational tables reachable from{" "}
        <Link className="underline" href="/payments">
          payments
        </Link>{" "}
        /
        {" "}
        <Link href="/financials" className="underline">
          financials
        </Link>{" "}
        /
        {" "}
        <Link href="/activity" className="underline">
          activity log
        </Link>
        .
      </p>
    </div>
  );
}

function ExportCard({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href?: string;
}) {
  return (
    <div className={`${cardClass} flex flex-col justify-between opacity-95`}>
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      </div>
      {href ? (
        <a
          href={href}
          className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Download
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-6 w-full rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400 dark:border-zinc-700"
        >
          Generate (wired next)
        </button>
      )}
    </div>
  );
}
