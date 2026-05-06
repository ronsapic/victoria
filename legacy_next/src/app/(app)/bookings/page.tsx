import { createBooking, setBookingStatus } from "@/actions/bookings";
import { ModuleHeader } from "@/components/module-header";
import {
  btnGhostClass,
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

export default async function BookingsPage() {
  const rows = await prisma.booking.findMany({
    orderBy: { startsAt: "asc" },
    take: 40,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="bookings" />

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Ask for a reservation
          </h3>
          <form action={createBooking} className="space-y-3">
            <div>
              <label className={labelClass}>Resource</label>
              <select name="resource" className={inputClass} required>
                <option value="PARKING">Parking bay</option>
                <option value="MEETING_ROOM">Meeting room</option>
                <option value="HALL">Function hall</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Starts</label>
              <input
                name="startsAt"
                type="datetime-local"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ends</label>
              <input
                name="endsAt"
                type="datetime-local"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Requesting unit / party</label>
              <input name="unitLabel" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Purpose</label>
              <textarea name="notes" rows={2} className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Submit for approval
            </button>
          </form>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Calendar preview
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Resource</th>
                <th className={thClass}>Requested by</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Admin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className={tdClass}>
                    {formatDateTime(b.startsAt)} — {formatDateTime(b.endsAt)}
                  </td>
                  <td className={tdClass}>{b.resource}</td>
                  <td className={tdClass}>{b.unitLabel ?? "—"}</td>
                  <td className={tdClass}>{b.status}</td>
                  <td className={tdClass}>
                    {b.status === "PENDING" && (
                      <div className="flex flex-wrap gap-1">
                        <form action={setBookingStatus}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <button type="submit" className={btnGhostClass}>
                            Approve
                          </button>
                        </form>
                        <form action={setBookingStatus}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <button type="submit" className={btnGhostClass}>
                            Reject
                          </button>
                        </form>
                      </div>
                    )}
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
