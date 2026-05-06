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
import { formatCurrencyTZS } from "@/lib/format";
import { addBudgetLine, createBudgetYear } from "@/actions/budgeting";

export default async function BudgetingPage() {
  await requireAnyRole(["accountant", "auditor"]);

  const years = await prisma.budgetYear.findMany({
    orderBy: { year: "desc" },
    include: {
      depts: { include: { lines: true } },
    },
    take: 5,
  });

  const current = years[0] ?? null;

  const expenses = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
  });
  const actualByCategory = new Map(
    expenses.map((e) => [e.category, e._sum.amount ?? 0]),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="budgeting" />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Create yearly budget
          </h3>
          <form action={createBudgetYear} className="space-y-3">
            <div>
              <label className={labelClass}>Year</label>
              <input
                name="year"
                type="number"
                defaultValue={new Date().getFullYear()}
                required
                className={inputClass}
              />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Create / select year
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Add budget line
          </h3>
          {current ? (
            <form action={addBudgetLine} className="space-y-3">
              <input type="hidden" name="budgetYearId" value={current.id} />
              <div>
                <label className={labelClass}>Department</label>
                <select name="department" className={inputClass} defaultValue="UTILITIES">
                  <option value="SECURITY">Security</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Line title</label>
                <input name="title" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Planned (TZS)</label>
                <input name="planned" type="number" step="any" required className={inputClass} />
              </div>
              <button type="submit" className={`${btnPrimaryClass} w-full`}>
                Add line
              </button>
            </form>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create a budget year first.
            </p>
          )}
        </div>
      </section>

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Budget vs actual (current snapshot)
        </h3>
        {current ? (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Department</th>
                <th className={thClass}>Line</th>
                <th className={thClass}>Planned</th>
                <th className={thClass}>Actual (by expense category)</th>
                <th className={thClass}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {current.depts.flatMap((d) =>
                d.lines.map((l) => {
                  const actual = actualByCategory.get(d.name) ?? 0;
                  const variance = l.planned - actual;
                  return (
                    <tr key={l.id}>
                      <td className={tdClass}>{d.name}</td>
                      <td className={tdClass}>{l.title}</td>
                      <td className={tdClass}>{formatCurrencyTZS(l.planned)}</td>
                      <td className={tdClass}>{formatCurrencyTZS(actual)}</td>
                      <td className={tdClass}>{formatCurrencyTZS(variance)}</td>
                    </tr>
                  );
                }),
              )}
              {current.depts.length === 0 && (
                <tr>
                  <td className={tdClass} colSpan={5}>
                    No budget lines yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No budget created yet.
          </p>
        )}
      </section>
    </div>
  );
}

