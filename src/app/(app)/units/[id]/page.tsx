import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteUnit, updateUnit } from "@/actions/units";
import { ModuleHeader } from "@/components/module-header";
import {
  btnGhostClass,
  btnPrimaryClass,
  cardClass,
  inputClass,
  labelClass,
} from "@/components/form-styles";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";
import { addUnitMembership, endMembership } from "@/actions/access";
import { getSessionUser } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

export default async function UnitDetailPage({ params }: Props) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const { id } = await params;
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      incidents: true,
      maintenanceTickets: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 6, include: { payments: true } },
      memberships: {
        orderBy: { startDate: "desc" },
        include: { user: true },
      },
    },
  });

  if (!unit) notFound();

  if (sessionUser.role === "resident") {
    const isMember = unit.memberships.some(
      (m) => m.userId === sessionUser.id && m.endDate === null,
    );
    if (!isMember) notFound();
  } else {
    await requireAnyRole(["staff"]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="units" />
      <p>
        <Link
          href="/units"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400"
        >
          ← All units
        </Link>
      </p>

      <section className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          <div className={cardClass}>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Linked records (preview)
            </h3>
            <div className="mb-4 flex flex-wrap gap-2">
              <a
                href={`/api/units/${unit.id}/statement.csv`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Download statement CSV
              </a>
            </div>
            <dl className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-3">
              <div>
                <dt className="font-medium text-zinc-500">Incidents</dt>
                <dd className="text-lg tabular-nums text-zinc-900 dark:text-zinc-50">
                  {unit.incidents.length}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Maintenance</dt>
                <dd className="text-lg tabular-nums text-zinc-900 dark:text-zinc-50">
                  {unit.maintenanceTickets.length}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Invoices loaded</dt>
                <dd className="text-lg tabular-nums text-zinc-900 dark:text-zinc-50">
                  {unit.invoices.length}
                </dd>
              </div>
            </dl>
          </div>
          <div className={cardClass}>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Occupants & owners
            </h3>
            <ul className="space-y-2 text-sm">
              {unit.memberships.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {m.user.email}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {m.kind} · {m.endDate ? "ended" : "active"}
                    </p>
                  </div>
                  {!m.endDate && (
                    <form action={endMembership}>
                      <input type="hidden" name="membershipId" value={m.id} />
                      <button type="submit" className={btnGhostClass}>
                        End
                      </button>
                    </form>
                  )}
                </li>
              ))}
              {unit.memberships.length === 0 && (
                <li className="text-zinc-500">No memberships yet.</li>
              )}
            </ul>

            {sessionUser.role !== "resident" && (
              <form
                action={addUnitMembership}
                className="mt-6 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
              >
                <input type="hidden" name="unitId" value={unit.id} />
                <div>
                  <label className={labelClass}>User id (from Access page)</label>
                  <input
                    name="userId"
                    required
                    placeholder="paste user id"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kind</label>
                  <select name="kind" className={inputClass} defaultValue="TENANT">
                    <option value="TENANT">Tenant</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
                <button type="submit" className={`${btnPrimaryClass} w-full`}>
                  Add membership
                </button>
              </form>
            )}
          </div>
          <div className={cardClass}>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Recent invoices
            </h3>
            <ul className="space-y-2 text-sm">
              {unit.invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950"
                >
                  <span>{inv.periodLabel}</span>
                  <span className="text-right">
                    <span className="block">{inv.status}</span>
                    <span className="block text-xs text-zinc-500">
                      bal:{" "}
                      {Math.max(
                        0,
                        inv.amount - inv.payments.reduce((s, p) => s + p.amount, 0),
                      ).toLocaleString()}
                    </span>
                  </span>
                </li>
              ))}
              {unit.invoices.length === 0 && (
                <li className="text-zinc-500">No invoices linked.</li>
              )}
            </ul>
          </div>
        </div>

        <div className={`${cardClass} space-y-4`}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Edit unit
          </h3>
          <form action={updateUnit} className="space-y-3">
            <input type="hidden" name="id" value={unit.id} />
            <div>
              <label className={labelClass}>Number</label>
              <input
                name="number"
                required
                defaultValue={unit.number}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Floor</label>
              <input
                name="floor"
                type="number"
                required
                defaultValue={unit.floor}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Area (m²)</label>
              <input
                name="sizeSqm"
                type="number"
                step="any"
                defaultValue={unit.sizeSqm ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ownership share %</label>
              <input
                name="ownershipSharePct"
                type="number"
                step="any"
                defaultValue={unit.ownershipSharePct}
                className={inputClass}
              />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save changes
            </button>
          </form>
          <form action={deleteUnit} className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <input type="hidden" name="id" value={unit.id} />
            <button type="submit" className={`${btnGhostClass} w-full text-red-600`}>
              Delete unit
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
