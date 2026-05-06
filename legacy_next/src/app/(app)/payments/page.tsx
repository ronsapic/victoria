import Link from "next/link";

import { createInvoice, setInvoiceStatus } from "@/actions/invoices";
import { allocatePaymentToUnit, recordPayment } from "@/actions/payments";
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
import { formatCurrencyTZS, formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export default async function PaymentsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const isFinance =
    sessionUser.role === "admin" || sessionUser.role === "accountant";

  const [rows, units] = await Promise.all([
    sessionUser.role === "resident"
      ? prisma.invoice.findMany({
          where: {
            unit: {
              memberships: { some: { userId: sessionUser.id, endDate: null } },
            },
          },
          orderBy: { dueDate: "desc" },
          include: { unit: true, payments: true },
        })
      : prisma.invoice.findMany({
          orderBy: { dueDate: "desc" },
          include: { unit: true, payments: true },
        }),
    prisma.unit.findMany({ orderBy: { number: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="payments" />

      <section className="grid gap-6 lg:grid-cols-[340px,1fr]">
        {isFinance && (
          <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Raise invoice / charge notice
          </h3>
          <form action={createInvoice} className="space-y-3">
            <div>
              <label className={labelClass}>Unit</label>
              <select name="unitId" required className={inputClass}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Billing period label</label>
              <input
                name="periodLabel"
                required
                placeholder="2026-06"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Amount (TZS)</label>
              <input name="amount" type="number" step="any" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Due date</label>
              <input name="dueDate" type="date" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" className={inputClass} defaultValue="PENDING">
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Record charge
            </button>
          </form>
          <p className="mt-4 text-xs text-zinc-500">
            PDF delivery and gateways wire in later — this persists ledger rows only.
          </p>
          </div>
        )}

        {isFinance && (
          <div className={`${cardClass} h-fit`}>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Allocate payment (oldest invoices first)
            </h3>
            <form action={allocatePaymentToUnit} className="space-y-3">
              <div>
                <label className={labelClass}>Unit</label>
                <select name="unitId" required className={inputClass}>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Amount (TZS)</label>
                <input
                  name="amount"
                  type="number"
                  step="any"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Method</label>
                <select name="method" className={inputClass} defaultValue="BANK">
                  <option value="BANK">Bank</option>
                  <option value="MOBILE_MONEY">Mobile money</option>
                  <option value="CASH">Cash</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Reference</label>
                <input name="reference" className={inputClass} />
              </div>
              <button type="submit" className={`${btnPrimaryClass} w-full`}>
                Allocate
              </button>
            </form>
            <p className="mt-3 text-xs text-zinc-500">
              Creates one payment entry per invoice allocation; stops when the
              amount runs out.
            </p>
          </div>
        )}

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {sessionUser.role === "resident" ? "My invoices" : "Ledger"}
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Period</th>
                <th className={thClass}>Unit</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>Paid</th>
                <th className={thClass}>Balance</th>
                <th className={thClass}>Due</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={tdClass}>
                    <Link href={`/payments/${row.id}`} className="underline">
                      {row.periodLabel}
                    </Link>
                  </td>
                  <td className={tdClass}>{row.unit.number}</td>
                  <td className={tdClass}>
                    {formatCurrencyTZS(row.amount)}
                  </td>
                  <td className={tdClass}>
                    {formatCurrencyTZS(
                      row.payments.reduce((s, p) => s + p.amount, 0),
                    )}
                  </td>
                  <td className={tdClass}>
                    {formatCurrencyTZS(
                      Math.max(
                        0,
                        row.amount -
                          row.payments.reduce((s, p) => s + p.amount, 0),
                      ),
                    )}
                  </td>
                  <td className={tdClass}>{formatDate(row.dueDate)}</td>
                  <td className={tdClass}>{row.status}</td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    {isFinance && (
                      <>
                        {row.status !== "PAID" && (
                          <form action={recordPayment} className="flex flex-wrap gap-1">
                            <input type="hidden" name="invoiceId" value={row.id} />
                            <input
                              name="amount"
                              type="number"
                              step="any"
                              placeholder="amt"
                              className="w-24 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                              required
                            />
                            <select
                              name="method"
                              className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                              defaultValue="BANK"
                            >
                              <option value="BANK">Bank</option>
                              <option value="MOBILE_MONEY">Mobile money</option>
                              <option value="CASH">Cash</option>
                              <option value="ADJUSTMENT">Adjustment</option>
                            </select>
                            <input
                              name="reference"
                              placeholder="ref"
                              className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                            />
                            <button type="submit" className={btnGhostClass}>
                              Add payment
                            </button>
                          </form>
                        )}
                        {row.status !== "PAID" && (
                          <form action={setInvoiceStatus}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="status" value="PAID" />
                            <button type="submit" className={btnGhostClass}>
                              Paid
                            </button>
                          </form>
                        )}
                        <form action={setInvoiceStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="OVERDUE" />
                          <button type="submit" className={btnGhostClass}>
                            Overdue
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">No charges yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
