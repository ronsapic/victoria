import fs from "node:fs/promises";

import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { storedFilePath } from "@/lib/storage/paths";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { id } = await params;
  const f = await prisma.storedFile.findUnique({ where: { id } });
  if (!f) notFound();

  const allowed =
    f.visibility === "RESIDENTS" ||
    user.role === "admin" ||
    user.role === "auditor" ||
    user.role === "accountant" ||
    user.role === "staff";

  if (!allowed) notFound();

  const buf = await fs.readFile(storedFilePath(f.storagePath));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": f.mimeType,
      "Content-Length": String(buf.length),
      // inline so <img> can render
      "Content-Disposition": `inline; filename="${encodeURIComponent(f.originalName)}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

