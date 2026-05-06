import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrencyTZS, formatDate } from "@/lib/format";
import { streamToBuffer } from "@/lib/pdf/stream";

export const runtime = "nodejs";

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

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, invoice.amount - paid);

  const pdf = await streamToBuffer((dest) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(dest);

    doc.fontSize(18).text("Victoria Place Association", { align: "left" });
    doc.moveDown(0.25);
    doc.fontSize(12).fillColor("#444").text("Service charge invoice");
    doc.moveDown(1);

    doc.fillColor("#000");
    doc.fontSize(12);
    doc.text(`Invoice: ${invoice.id}`);
    doc.text(`Unit: ${invoice.unit.number}`);
    doc.text(`Period: ${invoice.periodLabel}`);
    doc.text(`Due date: ${formatDate(invoice.dueDate)}`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown(1);

    doc.fontSize(13).text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Amount: ${formatCurrencyTZS(invoice.amount)}`);
    doc.text(`Paid: ${formatCurrencyTZS(paid)}`);
    doc.text(`Balance: ${formatCurrencyTZS(balance)}`);

    doc.moveDown(1.25);
    doc.fontSize(13).text("Payments", { underline: true });
    doc.moveDown(0.5);

    if (invoice.payments.length === 0) {
      doc
        .fontSize(12)
        .fillColor("#444")
        .text("No payments recorded yet.");
    } else {
      doc.fillColor("#000").fontSize(11);
      invoice.payments.forEach((p, idx) => {
        const ref = p.reference ? ` · Ref: ${p.reference}` : "";
        doc.text(
          `${idx + 1}. ${p.receivedAt.toLocaleString()} · ${p.method}${ref} · ${formatCurrencyTZS(p.amount)}`,
        );
      });
    }

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("#666")
      .text(
        `Generated on ${new Date().toLocaleString()} · Signed in as ${sessionUser.email}`,
      );

    doc.end();
  });

  const filename = `invoice-${invoice.unit.number}-${invoice.periodLabel}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

