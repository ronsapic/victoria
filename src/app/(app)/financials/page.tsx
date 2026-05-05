import { createExpense } from "@/actions/expenses";
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
import { formatCurrencyTZS, formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";

export default async function FinancialsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [expenses, incomeMonth, expenseMonth] = await Promise.all([
    prisma.expense.findMany({ orderBy: { occurredAt: "desc" }, take: 40 }),
    prisma.invoice.aggregate({
      where: { status: "PAID", createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { occurredAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ]);

  const inflow = incomeMonth._sum.amount ?? 0;
  const outflow = expenseMonth._sum.amount ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="financials" />

      <section className="grid gap-3 sm:grid-cols-2">
        <div className={`${cardClass} border-l-4 border-l-green-600`}>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Recorded receipts (paid invoices MTD)
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrencyTZS(inflow)}
          </p>
        </div>
        <div className={`${cardClass} border-l-4 border-l-orange-600`}>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Expenses (MTD)
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrencyTZS(outflow)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Log expense
          </h3>
          <form action={createExpense} className="space-y-3">
            <div>
              <label className={labelClass}>Category</label>
              <select name="category" className={inputClass} required>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="UTILITIES">Utilities</option>
                <option value="SALARIES">Salaries</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                rows={2}
                className={`${inputClass} min-h-[60px]`}
              />
            </div>
            <div>
              <label className={labelClass}>Amount (TZS)</label>
              <input name="amount" type="number" step="any" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Occurred on</label>
              <input name="occurredAt" type="date" required className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save expense
            </button>
          </form>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Expense ledger
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Memo</th>
                <th className={thClass}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className={tdClass}>{formatDate(e.occurredAt)}</td>
                  <td className={tdClass}>{e.category}</td>
                  <td className={tdClass}>{e.description}</td>
                  <td className={tdClass}>
                    {formatCurrencyTZS(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
