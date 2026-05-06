import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { AUTOMATION_DEFAULTS } from "@/lib/automation/config";

export const runtime = "nodejs";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

async function runMonthlyInvoices(now: Date) {
  // Create invoices for current month label YYYY-MM if missing per unit.
  const label = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const units = await prisma.unit.findMany();

  let created = 0;
  for (const u of units) {
    const exists = await prisma.invoice.findFirst({
      where: { unitId: u.id, periodLabel: label },
      select: { id: true },
    });
    if (exists) continue;
    const dueDate = addDays(now, AUTOMATION_DEFAULTS.invoiceDueInDays);
    await prisma.invoice.create({
      data: {
        unitId: u.id,
        periodLabel: label,
        amount: 250000, // default placeholder; replace with unit-based rules later
        status: "PENDING",
        dueDate,
      },
    });
    created++;
  }
  return created;
}

async function runReminders(now: Date) {
  // Queue reminders for invoices due soon / overdue recently.
  const before = addDays(now, AUTOMATION_DEFAULTS.remindBeforeDueDays);
  const after = addDays(now, -AUTOMATION_DEFAULTS.remindAfterDueDays);

  const dueSoon = await prisma.invoice.findMany({
    where: { status: { in: ["PENDING", "OVERDUE"] }, dueDate: { lte: before, gte: now } },
    include: { unit: true },
    take: 200,
  });
  const overdueRecent = await prisma.invoice.findMany({
    where: { status: "OVERDUE", dueDate: { gte: after, lt: now } },
    include: { unit: true },
    take: 200,
  });

  const all = [...dueSoon, ...overdueRecent];
  let queued = 0;
  for (const inv of all) {
    const payload = {
      unitId: inv.unitId,
      invoiceId: inv.id,
      periodLabel: inv.periodLabel,
      dueDate: inv.dueDate.toISOString(),
      amount: inv.amount,
      status: inv.status,
    };
    await prisma.reminderJob.create({
      data: {
        unitId: inv.unitId,
        channel: "EMAIL",
        template: "SERVICE_CHARGE_REMINDER",
        payload,
      },
    });
    queued++;
  }
  return queued;
}

async function runAutoClose(now: Date) {
  const cutoff = addDays(now, -AUTOMATION_DEFAULTS.autoCloseResolvedDays);
  const updated = await prisma.incident.updateMany({
    where: { status: "RESOLVED", updatedAt: { lt: cutoff } },
    data: { status: "CLOSED" },
  });
  return updated.count;
}

async function runEscalations(now: Date) {
  const cutoff = addDays(now, -AUTOMATION_DEFAULTS.escalateOpenDays);
  const stuck = await prisma.incident.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] }, createdAt: { lt: cutoff } },
    take: 50,
  });
  for (const i of stuck) {
    await prisma.activityLog.create({
      data: {
        action: "escalate_incident",
        entity: "incident",
        entityId: i.id,
        metadata: { title: i.title, status: i.status },
      },
    });
  }
  return stuck.length;
}

async function runRecurringMaintenance(now: Date) {
  const due = await prisma.maintenanceSchedule.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    take: 100,
  });
  let created = 0;
  for (const s of due) {
    await prisma.maintenanceTicket.create({
      data: {
        unitId: s.unitId,
        assetId: s.assetId,
        title: s.title,
        description: s.description || "Scheduled maintenance",
        status: "OPEN",
        contractor: s.assignee ?? undefined,
      },
    });
    created++;
    await prisma.maintenanceSchedule.update({
      where: { id: s.id },
      data: { nextRunAt: addDays(s.nextRunAt, s.intervalDays) },
    });
  }
  return created;
}

async function runAutoCloseMaintenance(now: Date) {
  const cutoff = addDays(now, -AUTOMATION_DEFAULTS.autoCloseResolvedDays);
  const updated = await prisma.maintenanceTicket.updateMany({
    where: { status: "DONE", completedAt: { lt: cutoff } },
    data: { status: "CLOSED" },
  });
  return updated.count;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "accountant")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { kinds?: string[] };
  const kinds = new Set((body.kinds ?? []).map((k) => k.toUpperCase()));

  const now = new Date();
  const requested = kinds.size > 0;

  const should = (k: string) => !requested || kinds.has(k);

  const results: Record<string, number> = {};

  if (should("MONTHLY_INVOICES")) results.MONTHLY_INVOICES = await runMonthlyInvoices(startOfMonth(now));
  if (should("REMINDERS")) results.REMINDERS = await runReminders(now);
  if (should("AUTO_CLOSE")) results.AUTO_CLOSE = await runAutoClose(now);
  if (should("ESCALATE")) results.ESCALATE = await runEscalations(now);
  if (should("RECURRING_MAINTENANCE")) results.RECURRING_MAINTENANCE = await runRecurringMaintenance(now);
  if (should("AUTO_CLOSE_MAINTENANCE")) results.AUTO_CLOSE_MAINTENANCE = await runAutoCloseMaintenance(now);

  await logActivity({
    action: "automation_run",
    entity: "automation",
    metadata: { results, requestedKinds: [...kinds] },
  });

  return NextResponse.json({ ok: true, results });
}

