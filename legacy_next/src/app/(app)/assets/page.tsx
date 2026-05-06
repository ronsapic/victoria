import { createAsset } from "@/actions/assets";
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

export default async function AssetsPage() {
  const assets = await prisma.asset.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="assets" />

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Asset register addition
          </h3>
          <form action={createAsset} className="space-y-3">
            <div>
              <label className={labelClass}>Equipment name</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Classification</label>
              <select name="category" className={inputClass} required>
                <option value="ELEVATOR">Elevator</option>
                <option value="GENERATOR">Generator</option>
                <option value="PUMP">Pump</option>
                <option value="HVAC">HVAC</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Condition memo</label>
              <textarea name="conditionNote" rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last service</label>
              <input name="lastServiceAt" type="date" className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save asset
            </button>
          </form>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Inventory roster
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Asset</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Condition</th>
                <th className={thClass}>Last service</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td className={tdClass}>{a.name}</td>
                  <td className={tdClass}>{a.category}</td>
                  <td className={tdClass}>{a.conditionNote ?? "—"}</td>
                  <td className={tdClass}>
                    {a.lastServiceAt ? formatDate(a.lastServiceAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
