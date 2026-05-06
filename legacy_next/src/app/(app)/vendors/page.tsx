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
import { requireAnyRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { formatCurrencyTZS, formatDate } from "@/lib/format";
import { addQuote, createVendor, setQuoteStatus } from "@/actions/vendors";

export default async function VendorsPage() {
  await requireAnyRole(["accountant", "auditor"]);

  const [vendors, quotes] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.vendorQuote.findMany({
      orderBy: { createdAt: "desc" },
      include: { vendor: true },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="vendors" />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Register vendor
          </h3>
          <form action={createVendor} className="space-y-3">
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select name="category" className={inputClass} defaultValue="REPAIRS">
                <option value="CLEANING">Cleaning</option>
                <option value="SECURITY">Security</option>
                <option value="REPAIRS">Repairs</option>
                <option value="UTILITIES">Utilities</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Phone</label>
                <input name="phone" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input name="email" type="email" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea name="notes" rows={3} className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save vendor
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Upload quotation (metadata)
          </h3>
          <form action={addQuote} className="space-y-3">
            <div>
              <label className={labelClass}>Vendor</label>
              <select name="vendorId" required className={inputClass}>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Quote title</label>
              <input name="title" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Amount (TZS)</label>
              <input name="amount" type="number" step="any" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reference (file key / URL)</label>
              <input name="reference" className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Add quote
            </button>
          </form>
        </div>
      </section>

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Vendors
        </h3>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Created</th>
              <th className={thClass}>Vendor</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Reach</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className={tdClass}>{formatDate(v.createdAt)}</td>
                <td className={tdClass}>{v.name}</td>
                <td className={tdClass}>{v.category}</td>
                <td className={tdClass}>{v.phone || v.email || "—"}</td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={4}>
                  No vendors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Quotations
        </h3>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Vendor</th>
              <th className={thClass}>Title</th>
              <th className={thClass}>Amount</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Approve</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td className={tdClass}>{formatDate(q.createdAt)}</td>
                <td className={tdClass}>{q.vendor.name}</td>
                <td className={tdClass}>{q.title}</td>
                <td className={tdClass}>{formatCurrencyTZS(q.amount)}</td>
                <td className={tdClass}>{q.status}</td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-2">
                    <form action={setQuoteStatus}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button type="submit" className={btnGhostClass}>
                        Approve
                      </button>
                    </form>
                    <form action={setQuoteStatus}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button type="submit" className={btnGhostClass}>
                        Reject
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={6}>
                  No quotes uploaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

