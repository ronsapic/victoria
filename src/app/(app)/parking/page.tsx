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
import { requireAnyRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { assignParking, createParkingSlot, logViolation } from "@/actions/parking";

export default async function ParkingPage() {
  await requireAnyRole(["staff"]);

  const [slots, units, assignments, violations] = await Promise.all([
    prisma.parkingSlot.findMany({ orderBy: { code: "asc" }, take: 200 }),
    prisma.unit.findMany({ orderBy: { number: "asc" }, take: 200 }),
    prisma.parkingAssignment.findMany({
      orderBy: { startDate: "desc" },
      include: { slot: true, unit: true },
      take: 100,
    }),
    prisma.parkingViolation.findMany({
      orderBy: { createdAt: "desc" },
      include: { slot: true },
      take: 100,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="parking" />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Create slot
          </h3>
          <form action={createParkingSlot} className="space-y-3">
            <div>
              <label className={labelClass}>Slot code</label>
              <input name="code" required placeholder="P-01" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Note</label>
              <input name="note" className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Add slot
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Assign slot
          </h3>
          <form action={assignParking} className="space-y-3">
            <div>
              <label className={labelClass}>Slot</label>
              <select name="slotId" required className={inputClass}>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}
                  </option>
                ))}
              </select>
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
              <label className={labelClass}>Vehicle plate</label>
              <input name="vehiclePlate" className={inputClass} placeholder="T 123 ABC" />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Assign
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Log violation
          </h3>
          <form action={logViolation} className="space-y-3">
            <div>
              <label className={labelClass}>Vehicle plate</label>
              <input name="vehiclePlate" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Slot (optional)</label>
              <select name="slotId" className={inputClass}>
                <option value="">—</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit label (optional)</label>
              <input name="unitLabel" className={inputClass} placeholder="B-204" />
            </div>
            <div>
              <label className={labelClass}>Note</label>
              <input name="note" className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save violation
            </button>
          </form>
        </div>
      </section>

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent assignments
        </h3>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Start</th>
              <th className={thClass}>Slot</th>
              <th className={thClass}>Unit</th>
              <th className={thClass}>Vehicle</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className={tdClass}>{a.startDate.toLocaleString()}</td>
                <td className={tdClass}>{a.slot.code}</td>
                <td className={tdClass}>{a.unit?.number ?? "—"}</td>
                <td className={tdClass}>{a.vehiclePlate ?? "—"}</td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={4}>
                  No assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Violations
        </h3>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>When</th>
              <th className={thClass}>Plate</th>
              <th className={thClass}>Slot</th>
              <th className={thClass}>Unit</th>
              <th className={thClass}>Note</th>
            </tr>
          </thead>
          <tbody>
            {violations.map((v) => (
              <tr key={v.id}>
                <td className={tdClass}>{formatDateTime(v.createdAt)}</td>
                <td className={tdClass}>{v.vehiclePlate}</td>
                <td className={tdClass}>{v.slot?.code ?? "—"}</td>
                <td className={tdClass}>{v.unitLabel ?? "—"}</td>
                <td className={tdClass}>{v.note ?? "—"}</td>
              </tr>
            ))}
            {violations.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={5}>
                  No violations logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

