import Link from "next/link";

import { cardClass, tableClass, tdClass, thClass } from "@/components/form-styles";

import { requireUser } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { formatCurrencyTZS, formatDate } from "@/lib/format";
import { addOccupant, addVehicle } from "@/actions/residents";
import { btnPrimaryClass, inputClass, labelClass } from "@/components/form-styles";

export default async function MePage() {
  const user = await requireUser();

  const profile = await prisma.residentProfile.findUnique({
    where: { userId: user.id },
    include: { vehicles: true, occupants: true },
  });

  const memberships = await prisma.unitMembership.findMany({
    where: { userId: user.id, endDate: null },
    include: {
      unit: {
        include: {
          invoices: { orderBy: { dueDate: "desc" }, take: 24 },
          waterReadings: { orderBy: { readDate: "desc" }, take: 2 },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          My unit
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Personalized view based on your Unit memberships (owner/tenant).
        </p>
      </div>

      {memberships.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No unit is assigned to your account yet.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Ask the committee to assign you under{" "}
            <Link href="/access" className="underline">
              Access & roles
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {memberships.map((m) => {
            const unit = m.unit;
            const pending = unit.invoices.filter((i) => i.status !== "PAID");
            const outstanding = pending.reduce((s, i) => s + i.amount, 0);
            const latest = unit.waterReadings[0];
            const prev = unit.waterReadings[1];
            const consumption =
              latest && prev ? latest.reading - prev.reading : null;

            return (
              <section key={m.id} className="grid gap-6 lg:grid-cols-[1fr,1fr]">
                <div className={cardClass}>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Unit {unit.number}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {m.kind} · Floor {unit.floor}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/api/units/${unit.id}/statement.csv`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                    >
                      Download statement CSV
                    </a>
                    <Link
                      href={`/units/${unit.id}`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                    >
                      View unit
                    </Link>
                  </div>

                  <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-500">
                        Outstanding
                      </dt>
                      <dd className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                        {formatCurrencyTZS(outstanding)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-500">
                        Water last interval Δ
                      </dt>
                      <dd className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                        {consumption != null ? consumption : "—"}
                      </dd>
                      <p className="mt-1 text-xs text-zinc-500">
                        {latest ? `as of ${formatDate(latest.readDate)}` : "no readings yet"}
                      </p>
                    </div>
                  </dl>
                </div>

                <div className={`${cardClass} overflow-x-auto`}>
                  <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Recent invoices
                  </h4>
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={thClass}>Period</th>
                        <th className={thClass}>Due</th>
                        <th className={thClass}>Amount</th>
                        <th className={thClass}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unit.invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className={tdClass}>{inv.periodLabel}</td>
                          <td className={tdClass}>{formatDate(inv.dueDate)}</td>
                          <td className={tdClass}>
                            {formatCurrencyTZS(inv.amount)}
                          </td>
                          <td className={tdClass}>{inv.status}</td>
                        </tr>
                      ))}
                      {unit.invoices.length === 0 && (
                        <tr>
                          <td className={tdClass} colSpan={4}>
                            No invoices.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Family members / occupants
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {(profile?.occupants ?? []).map((o) => (
              <li key={o.id} className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
                <span className="font-medium">{o.name}</span>
                <span className="ml-2 text-xs text-zinc-500">{o.relation ?? "—"}</span>
              </li>
            ))}
            {(profile?.occupants?.length ?? 0) === 0 && (
              <li className="text-zinc-500">No occupants listed.</li>
            )}
          </ul>
          <form action={addOccupant} className="mt-6 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Relationship</label>
              <input name="relation" className={inputClass} placeholder="spouse, child, etc" />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Add occupant
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Vehicles owned
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {(profile?.vehicles ?? []).map((v) => (
              <li key={v.id} className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
                <span className="font-medium">{v.plate}</span>
                <span className="ml-2 text-xs text-zinc-500">
                  {v.make ?? "—"} {v.color ?? ""}
                </span>
              </li>
            ))}
            {(profile?.vehicles?.length ?? 0) === 0 && (
              <li className="text-zinc-500">No vehicles registered.</li>
            )}
          </ul>
          <form action={addVehicle} className="mt-6 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div>
              <label className={labelClass}>Plate</label>
              <input name="plate" required className={inputClass} placeholder="T 123 ABC" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Make</label>
                <input name="make" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Color</label>
                <input name="color" className={inputClass} />
              </div>
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Add vehicle
            </button>
          </form>
        </div>
      </section>

      <div className="opacity-0">
        {/* noop block */}
      </div>
    </div>
  );
}

