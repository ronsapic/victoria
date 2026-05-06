import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ALERT_ROLES = new Set(["admin", "staff", "accountant"]);

/** Recent resident receipt uploads (for committee/caretaker dashboards). */
export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ALERT_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.activityLog.findMany({
    where: { action: "receipt_uploaded" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    alerts: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      entityId: r.entityId,
      metadata: r.metadata,
    })),
  });
}
