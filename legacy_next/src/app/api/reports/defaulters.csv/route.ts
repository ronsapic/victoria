import { NextResponse } from "next/server";

import { requireAnyRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export async function GET() {
  await requireAnyRole(["accountant", "auditor"]);

  const units = await prisma.unit.findMany({
    where: {
      invoices: { some: { status: { in: ["PENDING", "OVERDUE"] } } },
    },
    orderBy: { number: "asc" },
    include: {
      invoices: {
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  const header = [
    "unit_number",
    "open_invoices",
    "total_due",
    "oldest_due_date",
  ].join(",");

  const lines = units.map((u) => {
    const total = u.invoices.reduce((s, i) => s + i.amount, 0);
    const oldest = u.invoices[0]?.dueDate.toISOString().slice(0, 10) ?? "";
    return [
      csvEscape(u.number),
      String(u.invoices.length),
      String(total),
      oldest,
    ].join(",");
  });

  const body = [header, ...lines].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"defaulters.csv\"",
    },
  });
}

