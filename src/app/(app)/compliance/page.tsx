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
import { createComplianceDoc, createDeadline, markDeadlineDone } from "@/actions/compliance";
import { requireAnyRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function CompliancePage() {
  await requireAnyRole(["auditor"]);

  const [docs, deadlines] = await Promise.all([
    prisma.complianceDocument.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.complianceDeadline.findMany({ orderBy: { dueDate: "asc" }, take: 50 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="compliance" />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Store bylaws / constitution
          </h3>
          <form action={createComplianceDoc} className="space-y-3">
            <div>
              <label className={labelClass}>Title</label>
              <input name="title" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select name="category" className={inputClass} defaultValue="BYLAWS">
                <option value="BYLAWS">Bylaws</option>
                <option value="CONSTITUTION">Constitution</option>
                <option value="POLICY">Policy</option>
                <option value="CONTRACT">Contract</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Reference (URL / storage key)</label>
              <input name="reference" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea name="notes" rows={3} className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save document
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Compliance deadlines
          </h3>
          <form action={createDeadline} className="space-y-3">
            <div>
              <label className={labelClass}>Title</label>
              <input name="title" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Due date</label>
              <input name="dueDate" type="date" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Details</label>
              <textarea name="description" rows={2} className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Add deadline
            </button>
          </form>

          <div className="mt-6 overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Due</th>
                  <th className={thClass}>Item</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {deadlines.map((d) => (
                  <tr key={d.id}>
                    <td className={tdClass}>{formatDate(d.dueDate)}</td>
                    <td className={tdClass}>{d.title}</td>
                    <td className={tdClass}>{d.status}</td>
                    <td className={tdClass}>
                      {d.status !== "DONE" && (
                        <form action={markDeadlineDone}>
                          <input type="hidden" name="id" value={d.id} />
                          <button className={btnGhostClass} type="submit">
                            Mark done
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {deadlines.length === 0 && (
                  <tr>
                    <td className={tdClass} colSpan={4}>
                      No deadlines yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Document register
        </h3>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Captured</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Title</th>
              <th className={thClass}>Reference</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td className={tdClass}>{formatDate(d.createdAt)}</td>
                <td className={tdClass}>{d.category}</td>
                <td className={tdClass}>{d.title}</td>
                <td className={tdClass}>{d.reference ?? "—"}</td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={4}>
                  No documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

