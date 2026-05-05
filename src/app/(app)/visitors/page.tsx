import { logVisitor } from "@/actions/visitors";
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
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/db";

export default async function VisitorsPage() {
  const entries = await prisma.visitorEntry.findMany({
    orderBy: { visitedAt: "desc" },
    take: 80,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="visitors" />

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Checkpoint entry
          </h3>
          <form action={logVisitor} className="space-y-3">
            <div>
              <label className={labelClass}>Guest name</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Mobile</label>
              <input name="phone" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Visiting flat / wing</label>
              <input
                name="unitVisit"
                required
                placeholder="B-304"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Desk notes</label>
              <textarea name="notes" rows={3} className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Admit log
            </button>
          </form>
          <p className="mt-4 text-xs text-zinc-500">
            Permanent QR onboarding can sync with physical security later.
          </p>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Gate register
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Arrival</th>
                <th className={thClass}>Visitor</th>
                <th className={thClass}>Purpose / unit</th>
                <th className={thClass}>Desk note</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className={tdClass}>{formatDateTime(e.visitedAt)}</td>
                  <td className={`${tdClass}`}>
                    {e.name}
                    <span className="block text-xs text-zinc-500">{e.phone}</span>
                  </td>
                  <td className={tdClass}>{e.unitVisit}</td>
                  <td className={tdClass}>{e.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
