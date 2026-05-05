import {
  createEmergencyContact,
  emergencyBroadcast,
  triggerPanicAlert,
} from "@/actions/emergency";
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

export default async function EmergencyPage() {
  const contacts = await prisma.emergencyContact.findMany({
    orderBy: { priority: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="emergency" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
            Resident SOS
          </h3>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Captures urgency while emergency routing is finalized.
          </p>
          <form action={triggerPanicAlert} className="mt-4 space-y-3">
            <div>
              <label className={labelClass}>Unit / location</label>
              <input name="unitLabel" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Brief context</label>
              <textarea name="note" rows={3} className={inputClass} />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Send panic beacon
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Committee broadcast stub
          </h3>
          <form action={emergencyBroadcast} className="mt-4 space-y-3">
            <textarea
              name="message"
              placeholder="Residents: assembly point ..."
              rows={5}
              required
              className={inputClass}
            />
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Queue broadcast trail
            </button>
          </form>
          <p className="mt-4 text-xs text-zinc-500">
            Sends only to activity log until SMS/push are wired.
          </p>
        </div>

        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Contacts
          </h3>
          <form action={createEmergencyContact} className="mt-4 space-y-3">
            <div>
              <label className={labelClass}>Label</label>
              <input name="label" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Dial order</label>
              <input
                name="priority"
                type="number"
                defaultValue={0}
                className={inputClass}
              />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Append contact row
            </button>
          </form>
          <table className={`${tableClass} mt-8`}>
            <thead>
              <tr>
                <th className={thClass}>Order</th>
                <th className={thClass}>Party</th>
                <th className={thClass}>Line</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td className={`${tdClass} text-xs text-zinc-500`}>{c.priority}</td>
                  <td className={tdClass}>{c.label}</td>
                  <td className={tdClass}>{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
