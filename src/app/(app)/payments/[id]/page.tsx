import Link from "next/link";
import { notFound } from "next/navigation";

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

import { recordPayment, reversePayment } from "@/actions/payments";
import { getSessionUser } from "@/lib/auth/session";
import { formatCurrencyTZS, formatDate, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: Props) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      unit: { include: { memberships: true } },
      payments: { orderBy: { receivedAt: "desc" } },
    },
  });

  if (!invoice) notFound();

  if (sessionUser.role === "resident") {
    const ok = invoice.unit.memberships.some(
      (m) => m.userId === sessionUser.id && m.endDate === null,
    );
    if (!ok) notFound();
  }

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, invoice.amount - paid);

  const isFinance =
    sessionUser.role === "admin" || sessionUser.role === "accountant";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="payments" />

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/payments" className="underline">
          ← Payments ledger
        </Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <div className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {invoice.periodLabel}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Unit <strong>{invoice.unit.number}</strong> · Due{" "}
              {formatDate(invoice.dueDate)} · Status <strong>{invoice.status}</strong>
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Amount
                </dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrencyTZS(invoice.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Paid
                </dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrencyTZS(paid)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Balance
                </dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrencyTZS(balance)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={`/api/payments/${invoice.id}/receipt.csv`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Download receipt CSV
              </a>
              <a
                href={`/api/payments/${invoice.id}/invoice.pdf`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Download invoice PDF
              </a>
              <Link
                href={`/units/${invoice.unitId}`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                View unit
              </Link>
            </div>
          </div>

          <div className={`${cardClass} overflow-x-auto`}>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Payment history
            </h3>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Method</th>
                  <th className={thClass}>Reference</th>
                  <th className={thClass}>Amount</th>
                  {isFinance && <th className={thClass}>Admin</th>}
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className={tdClass}>{formatDateTime(p.receivedAt)}</td>
                    <td className={tdClass}>{p.method}</td>
                    <td className={tdClass}>{p.reference ?? "—"}</td>
                    <td className={tdClass}>{formatCurrencyTZS(p.amount)}</td>
                    {isFinance && (
                      <td className={tdClass}>
                        {p.amount > 0 && (
                          <form action={reversePayment} className="flex gap-2">
                            <input type="hidden" name="paymentId" value={p.id} />
                            <input
                              name="reason"
                              placeholder="reason"
                              className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                            />
                            <button type="submit" className={btnGhostClass}>
                              Reverse
                            </button>
                          </form>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {invoice.payments.length === 0 && (
                  <tr>
                    <td className={tdClass} colSpan={isFinance ? 5 : 4}>
                      No payments recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isFinance && (
          <div className={`${cardClass} h-fit`}>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Record payment
            </h3>
            <form action={recordPayment} className="space-y-3">
              <input type="hidden" name="invoiceId" value={invoice.id} />
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
              <div>
                <label className={labelClass}>Received date</label>
                <input name="receivedAt" type="date" className={inputClass} />
              </div>
              <button type="submit" className={`${btnPrimaryClass} w-full`}>
                Save payment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

