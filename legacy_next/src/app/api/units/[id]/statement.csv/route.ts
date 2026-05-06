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
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      memberships: true,
      invoices: {
        orderBy: { dueDate: "asc" },
        include: { payments: { orderBy: { receivedAt: "asc" } } },
      },
    },
  });
  if (!unit) notFound();

  if (sessionUser.role === "resident") {
    const ok = unit.memberships.some(
      (m) => m.userId === sessionUser.id && m.endDate === null,
    );
    if (!ok) notFound();
  }

  const header = [
    "unit",
    "invoice_id",
    "period",
    "due_date",
    "invoice_amount",
    "status",
    "payment_id",
    "payment_date",
    "method",
    "reference",
    "payment_amount",
  ].join(",");

  const lines: string[] = [];
  for (const inv of unit.invoices) {
    if (inv.payments.length === 0) {
      lines.push(
        [
          csvEscape(unit.number),
          inv.id,
          csvEscape(inv.periodLabel),
          inv.dueDate.toISOString().slice(0, 10),
          String(inv.amount),
          inv.status,
          "",
          "",
          "",
          "",
          "",
        ].join(","),
      );
      continue;
    }
    for (const p of inv.payments) {
      lines.push(
        [
          csvEscape(unit.number),
          inv.id,
          csvEscape(inv.periodLabel),
          inv.dueDate.toISOString().slice(0, 10),
          String(inv.amount),
          inv.status,
          p.id,
          p.receivedAt.toISOString(),
          p.method,
          csvEscape(p.reference ?? ""),
          String(p.amount),
        ].join(","),
      );
    }
  }

  const body = [header, ...lines].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"unit-${unit.number}-statement.csv\"`,
    },
  });
}

