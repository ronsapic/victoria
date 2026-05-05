import { createWaterReading } from "@/actions/water";
import { generateWaterBills } from "@/actions/water-billing";
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
import { getSessionUser } from "@/lib/auth/session";

const USE_ALERT = 200;

export default async function WaterPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const units = await prisma.unit.findMany({
    orderBy: { number: "asc" },
    include: {
      waterReadings: {
        orderBy: { readDate: "desc" },
        take: 2,
      },
      waterBills: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const rows = units.map((u) => {
    const latest = u.waterReadings[0];
    const prev = u.waterReadings[1];
    const consumption =
      latest && prev ? latest.reading - prev.reading : null;
    return {
      id: u.id,
      number: u.number,
      consumption,
      alert: consumption != null && consumption > USE_ALERT,
      reading: latest?.reading ?? null,
      readDate: latest?.readDate ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="water" />

      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Capture reading
          </h3>
          <form action={createWaterReading} className="space-y-3">
            <div>
              <label className={labelClass}>Unit meter</label>
              <select name="unitId" required className={inputClass}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Reading date</label>
              <input name="readDate" type="date" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Dial value (cum.)</label>
              <input name="reading" type="number" step="any" required className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Store reading
            </button>
          </form>
          <p className="mt-3 text-xs text-zinc-500">
            Alerts flag when newest interval exceeds {USE_ALERT} units consumed.
          </p>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Consumption overview
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Unit</th>
                <th className={thClass}>Last reading date</th>
                <th className={thClass}>Latest dial</th>
                <th className={thClass}>Last interval Δ</th>
                <th className={thClass}>Latest bill</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={tdClass}>{r.number}</td>
                  <td className={tdClass}>
                    {r.readDate ? formatDate(r.readDate) : "—"}
                  </td>
                  <td className={tdClass}>{r.reading ?? "—"}</td>
                  <td className={`${tdClass} ${r.alert ? "text-red-600 font-medium" : ""}`}>
                    {r.consumption != null ? r.consumption : "Need 2 readings"}
                    {r.alert ? " (check leak)" : ""}
                  </td>
                  <td className={tdClass}>
                    {units.find((u) => u.id === r.id)?.waterBills?.[0]
                      ? `${units.find((u) => u.id === r.id)!.waterBills[0]!.periodLabel} (${units
                          .find((u) => u.id === r.id)!
                          .waterBills[0]!.status})`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(sessionUser.role === "admin" || sessionUser.role === "accountant") && (
        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Generate water bills
          </h3>
          <form action={generateWaterBills} className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Period label</label>
              <input name="periodLabel" placeholder="2026-05" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rate per unit</label>
              <input name="ratePerUnit" type="number" step="any" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Alert threshold</label>
              <input name="alertThreshold" type="number" defaultValue={USE_ALERT} className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} sm:col-span-3`}>
              Generate / update bills
            </button>
          </form>
          <p className="mt-3 text-xs text-zinc-500">
            Uses latest two readings per unit; writes/updates `WaterBill` rows.
          </p>
        </div>
      )}
    </div>
  );
}
