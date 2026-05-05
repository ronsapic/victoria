import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) notFound();

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      unit: { include: { memberships: true } },
      payments: { orderBy: { receivedAt: "asc" } },
    },
  });
  if (!invoice) notFound();

  if (sessionUser.role === "resident") {
    const ok = invoice.unit.memberships.some(
      (m) => m.userId === sessionUser.id && m.endDate === null,
    );
    if (!ok) notFound();
  }

  const header = [
    "invoice_id",
    "unit",
    "period",
    "invoice_amount",
    "status",
    "payment_id",
    "received_at",
    "method",
    "reference",
    "amount",
  ].join(",");

  const lines = invoice.payments.map((p) =>
    [
      csvEscape(invoice.id),
      csvEscape(invoice.unit.number),
      csvEscape(invoice.periodLabel),
      String(invoice.amount),
      invoice.status,
      p.id,
      p.receivedAt.toISOString(),
      p.method,
      csvEscape(p.reference ?? ""),
      String(p.amount),
    ].join(","),
  );

  const body = [header, ...lines].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"invoice-${invoice.unit.number}-${invoice.periodLabel}.csv\"`,
    },
  });
}

