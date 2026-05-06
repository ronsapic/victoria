import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

import { requireAnyRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { formatCurrencyTZS, formatDate } from "@/lib/format";
import { streamToBuffer } from "@/lib/pdf/stream";

export const runtime = "nodejs";

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
    take: 500,
  });

  const rows = units.map((u) => {
    const total = u.invoices.reduce((s, i) => s + i.amount, 0);
    const oldest = u.invoices[0]?.dueDate ?? null;
    return {
      unitNumber: u.number,
      openInvoices: u.invoices.length,
      totalDue: total,
      oldestDue: oldest,
    };
  });

  const grandTotal = rows.reduce((s, r) => s + r.totalDue, 0);
  const pdf = await streamToBuffer((dest) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(dest);

    doc.fontSize(18).text("Victoria Place Association");
    doc.moveDown(0.25);
    doc.fontSize(12).fillColor("#444").text("Defaulters report (open invoices)");
    doc.moveDown(1);

    doc.fillColor("#000").fontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Units in report: ${rows.length}`);
    doc.text(`Total outstanding: ${formatCurrencyTZS(grandTotal)}`);
    doc.moveDown(1);

    doc.fontSize(11).text("Unit", 50, doc.y, { continued: true, width: 80 });
    doc.text("Open", { continued: true, width: 60 });
    doc.text("Oldest due", { continued: true, width: 120 });
    doc.text("Total due", { width: 150 });
    doc
      .moveTo(50, doc.y + 4)
      .lineTo(545, doc.y + 4)
      .strokeColor("#ddd")
      .stroke();
    doc.moveDown(0.6);

    rows.forEach((r) => {
      if (doc.y > 760) doc.addPage();
      doc
        .fillColor("#000")
        .text(r.unitNumber, 50, doc.y, { continued: true, width: 80 });
      doc.text(String(r.openInvoices), { continued: true, width: 60 });
      doc.text(r.oldestDue ? formatDate(r.oldestDue) : "—", {
        continued: true,
        width: 120,
      });
      doc.text(formatCurrencyTZS(r.totalDue), { width: 150 });
    });

    doc.end();
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"defaulters.pdf\"",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

