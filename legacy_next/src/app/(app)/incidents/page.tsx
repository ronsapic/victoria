import Link from "next/link";
import { createIncident } from "@/actions/incidents";
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
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";

export default async function IncidentsPage() {
  const [incidents, units] = await Promise.all([
    prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      include: { unit: true },
      take: 50,
    }),
    prisma.unit.findMany({ orderBy: { number: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="incidents" />

      <section className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Reports
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Title</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Unit</th>
                <th className={thClass}>Opened</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i.id}>
                  <td className={tdClass}>{i.title}</td>
                  <td className={tdClass}>{i.category}</td>
                  <td className={tdClass}>{i.status}</td>
                  <td className={tdClass}>
                    {i.unit ? i.unit.number : "—"}
                  </td>
                  <td className={tdClass}>{formatDate(i.createdAt)}</td>
                  <td className={tdClass}>
                    <Link
                      href={`/incidents/${i.id}`}
                      className="text-sm font-medium underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            New incident
          </h3>
          <form action={createIncident} className="space-y-3">
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
              <label className={labelClass}>Category</label>
              <select name="category" className={inputClass} defaultValue="General">
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Security">Security</option>
                <option value="Noise">Noise</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit (optional)</label>
              <select name="unitId" className={inputClass}>
                <option value="">— none —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Submit incident
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
