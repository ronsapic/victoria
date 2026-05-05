import { createAnnouncement } from "@/actions/announcements";
import { createComplaint } from "@/actions/complaints";
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
import { getSessionUser } from "@/lib/auth/session";

export default async function CommunicationsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const [announcements, complaints, units] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      include: { unit: true },
      take: 30,
    }),
    prisma.unit.findMany({ orderBy: { number: "asc" }, take: 200 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="communications" />

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        {sessionUser.role === "admin" ? (
          <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Compose announcement
          </h3>
          <form action={createAnnouncement} className="space-y-3">
            <div>
              <label className={labelClass}>Title</label>
              <input name="title" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Body</label>
              <textarea
                name="body"
                rows={6}
                required
                className={`${inputClass} min-h-[120px]`}
              />
            </div>
            <div>
              <label className={labelClass}>Audience tag</label>
              <select name="audience" className={inputClass} defaultValue="all">
                <option value="all">All residents</option>
                <option value="committee">Committee only</option>
              </select>
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Publish
            </button>
          </form>
          <p className="mt-4 text-xs text-zinc-500">
            Attach push/SMS/email delivery when providers are configured.
          </p>
          </div>
        ) : (
          <div className={`${cardClass} h-fit`}>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Submit complaint / feedback
            </h3>
            <form action={createComplaint} className="space-y-3">
              <div>
                <label className={labelClass}>Title</label>
                <input name="title" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Details</label>
                <textarea
                  name="body"
                  rows={6}
                  required
                  className={`${inputClass} min-h-[120px]`}
                />
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
              <button type="submit" className={`${btnPrimaryClass} w-full`}>
                Submit
              </button>
            </form>
            <p className="mt-4 text-xs text-zinc-500">
              Staff triage is visible in the list to the right.
            </p>
          </div>
        )}

        <div className={cardClass}>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Announcements
              </h3>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Published</th>
                    <th className={thClass}>Title</th>
                    <th className={thClass}>Reach</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => (
                    <tr key={a.id}>
                      <td className={tdClass}>{formatDateTime(a.createdAt)}</td>
                      <td className={`${tdClass} max-w-md`}>{a.title}</td>
                      <td className={tdClass}>{a.audience}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Complaints / feedback
              </h3>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Created</th>
                    <th className={thClass}>Title</th>
                    <th className={thClass}>Unit</th>
                    <th className={thClass}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td className={tdClass}>{formatDateTime(c.createdAt)}</td>
                      <td className={tdClass}>
                        <a className="underline" href={`/communications/${c.id}`}>
                          {c.title}
                        </a>
                      </td>
                      <td className={tdClass}>{c.unit?.number ?? "—"}</td>
                      <td className={tdClass}>{c.status}</td>
                    </tr>
                  ))}
                  {complaints.length === 0 && (
                    <tr>
                      <td className={tdClass} colSpan={4}>
                        No complaints yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
