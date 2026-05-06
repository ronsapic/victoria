import Link from "next/link";
import { createUnit } from "@/actions/units";
import { ModuleHeader } from "@/components/module-header";
import {
  btnPrimaryClass,
  cardClass,
  inputClass,
  labelClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/form-styles";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export default async function UnitsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const units =
    sessionUser.role === "resident"
      ? await prisma.unit.findMany({
          where: { memberships: { some: { userId: sessionUser.id, endDate: null } } },
          orderBy: [{ floor: "asc" }, { number: "asc" }],
        })
      : await prisma.unit.findMany({
          orderBy: [{ floor: "asc" }, { number: "asc" }],
        });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="units" />

      <section className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Units
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Unit</th>
                <th className={thClass}>Floor</th>
                <th className={thClass}>m²</th>
                <th className={thClass}>Share %</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id}>
                  <td className={tdClass}>{u.number}</td>
                  <td className={tdClass}>{u.floor}</td>
                  <td className={tdClass}>
                    {u.sizeSqm != null ? u.sizeSqm : "—"}
                  </td>
                  <td className={tdClass}>{u.ownershipSharePct}</td>
                  <td className={tdClass}>
                    <Link
                      href={`/units/${u.id}`}
                      className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {units.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              No units yet.
            </p>
          )}
        </div>

        {sessionUser.role !== "resident" && (
          <div className={cardClass}>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Add unit
            </h3>
            <form action={createUnit} className="space-y-3">
              <div>
                <label className={labelClass}>Number</label>
                <input name="number" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Floor</label>
                <input
                  name="floor"
                  type="number"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Area (m²)</label>
                <input
                  name="sizeSqm"
                  type="number"
                  step="any"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ownership share %</label>
                <input
                  name="ownershipSharePct"
                  type="number"
                  step="any"
                  defaultValue={100}
                  className={inputClass}
                />
              </div>
              <button type="submit" className={`${btnPrimaryClass} w-full`}>
                Save unit
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
