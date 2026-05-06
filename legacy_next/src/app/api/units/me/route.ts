import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Signed-in user's active unit memberships. */
export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  const rows = await prisma.unitMembership.findMany({
    where: {
      userId: user.id,
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: {
      unit: true,
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({
    memberships: rows.map((m) => ({
      id: m.id,
      kind: m.kind,
      startDate: m.startDate.toISOString(),
      endDate: m.endDate?.toISOString() ?? null,
      unit: {
        id: m.unit.id,
        number: m.unit.number,
        floor: m.unit.floor,
        sizeSqm: m.unit.sizeSqm,
        ownershipSharePct: m.unit.ownershipSharePct,
      },
    })),
  });
}
