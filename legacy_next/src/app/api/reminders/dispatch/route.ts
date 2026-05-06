import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "accountant")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.max(1, Math.min(200, Number(body.limit ?? 25) || 25));

  const pending = await prisma.reminderJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const now = new Date();
  const ids = pending.map((j) => j.id);
  if (ids.length) {
    await prisma.reminderJob.updateMany({
      where: { id: { in: ids } },
      data: { status: "SENT", sentAt: now },
    });
  }

  await logActivity({
    action: "dispatch_reminders_api",
    entity: "reminder_job",
    metadata: { count: ids.length, limit },
  });

  return NextResponse.json({ ok: true, count: ids.length });
}

