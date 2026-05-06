import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Association announcements visible to authenticated users. */
export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    announcements: rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      audience: r.audience,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
