import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Security / estates emergency dial list (ordering by priority desc). */
export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.emergencyContact.findMany({
    orderBy: [{ priority: "desc" }, { label: "asc" }],
    take: 50,
  });

  return NextResponse.json({
    contacts: rows.map((r) => ({
      id: r.id,
      label: r.label,
      phone: r.phone,
      priority: r.priority,
    })),
  });
}
