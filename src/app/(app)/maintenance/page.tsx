import Link from "next/link";
import { createMaintenanceTicket } from "@/actions/maintenance";
import { createSchedule, toggleSchedule } from "@/actions/maintenance-schedules";
import { ModuleHeader } from "@/components/module-header";
import {
  btnPrimaryClass,
  btnGhostClass,
  cardClass,
  inputClass,
  labelClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/form-styles";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";

export default async function MaintenancePage() {
  const [rows, units, schedules, assets] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: { unit: true },
    }),
    prisma.unit.findMany({ orderBy: { number: "asc" } }),
    prisma.maintenanceSchedule.findMany({
      orderBy: { nextRunAt: "asc" },
      include: { unit: true, asset: true },
      take: 50,
    }),
    prisma.asset.findMany({ orderBy: { name: "asc" }, take: 200 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="maintenance" />

      <section className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Tickets
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Job</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Contractor</th>
                <th className={thClass}>Opened</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={tdClass}>{r.title}</td>
                  <td className={tdClass}>{r.status}</td>
                  <td className={tdClass}>{r.contractor ?? "—"}</td>
                  <td className={tdClass}>{formatDate(r.createdAt)}</td>
                  <td className={tdClass}>
                    <Link href={`/maintenance/${r.id}`} className="underline text-sm font-medium">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            New ticket
          </h3>
          <form action={createMaintenanceTicket} className="space-y-3">
            <div>
              <label className={labelClass}>Title</label>
              <input name="title" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                rows={4}
                required
                className={`${inputClass} min-h-[100px]`}
              />
            </div>
            <div>
              <label className={labelClass}>Related unit</label>
              <select name="unitId" className={inputClass}>
                <option value="">— Estate-wide —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Create ticket
            </button>
          </form>
        </div>
      </section>

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recurring maintenance schedules
        </h3>
        <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
          <div>
            <form action={createSchedule} className="space-y-3">
              <div>
                <label className={labelClass}>Title</label>
                <input name="title" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea name="description" rows={3} className={inputClass} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Interval (days)</label>
                  <input name="intervalDays" type="number" defaultValue={30} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Next run</label>
                  <input name="nextRunAt" type="date" required className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Unit (optional)</label>
                <select name="unitId" className={inputClass}>
                  <option value="">—</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Asset (optional)</label>
                <select name="assetId" className={inputClass}>
                  <option value="">—</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Assignee (contractor/caretaker)</label>
                <input name="assignee" className={inputClass} />
              </div>
              <button type="submit" className={`${btnPrimaryClass} w-full`}>
                Create schedule
              </button>
              <p className="text-xs text-zinc-500">
                Run automation (`/api/automation/run`) with kind `RECURRING_MAINTENANCE` to generate due tickets.
              </p>
            </form>
          </div>

          <div>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Next run</th>
                  <th className={thClass}>Title</th>
                  <th className={thClass}>Interval</th>
                  <th className={thClass}>Scope</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td className={tdClass}>{formatDate(s.nextRunAt)}</td>
                    <td className={tdClass}>{s.title}</td>
                    <td className={tdClass}>{s.intervalDays} days</td>
                    <td className={tdClass}>
                      {s.unit?.number ?? s.asset?.name ?? "Estate"}
                    </td>
                    <td className={tdClass}>
                      <form action={toggleSchedule}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="active" value={String(!s.active)} />
                        <button type="submit" className={btnGhostClass}>
                          {s.active ? "Active" : "Paused"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {schedules.length === 0 && (
                  <tr>
                    <td className={tdClass} colSpan={5}>
                      No schedules yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
