import { NextResponse } from "next/server";

import { logActivity } from "@/lib/activity";
import { getSessionUser } from "@/lib/auth/session";
import { isCommitteeRole } from "@/lib/files/stored-file-access";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ELEVATED = new Set(["admin", "auditor", "accountant", "staff"]);

/** List registry entries; residents only see RESIDENTS visibility. */
export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = ELEVATED.has(user.role)
    ? {}
    : { visibility: "RESIDENTS" as const };

  const rows = await prisma.documentEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      file: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          category: true,
          visibility: true,
        },
      },
    },
  });

  return NextResponse.json({
    entries: rows.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      visibility: e.visibility,
      createdAt: e.createdAt.toISOString(),
      file: e.file,
    })),
  });
}

/** Attach metadata to an already-uploaded DOCUMENT file (committee). */
export async function POST(req: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCommitteeRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { fileId?: string; title?: string; category?: string; visibility?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fileId = String(body.fileId ?? "").trim();
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "").trim();
  const visibilityRaw = String(body.visibility ?? "PRIVATE").toUpperCase();

  if (!fileId || !title || !category) {
    return NextResponse.json(
      { error: "fileId, title, and category are required" },
      { status: 400 },
    );
  }

  const file = await prisma.storedFile.findUnique({
    where: { id: fileId },
    include: { documentEntry: true },
  });

  if (!file || file.category !== "DOCUMENT") {
    return NextResponse.json(
      { error: "fileId must reference a DOCUMENT upload from /api/files/upload" },
      { status: 400 },
    );
  }

  if (file.documentEntry) {
    return NextResponse.json(
      { error: "This file is already linked to the document register" },
      { status: 409 },
    );
  }

  const visibility = visibilityRaw === "RESIDENTS" ? "RESIDENTS" : "PRIVATE";

  const entry = await prisma.documentEntry.create({
    data: {
      title,
      category,
      visibility,
      fileId,
    },
  });

  await prisma.storedFile.update({
    where: { id: fileId },
    data: { visibility },
  });

  await logActivity({
    action: "create",
    entity: "document_entry",
    entityId: entry.id,
    metadata: { category, visibility, title },
  });

  return NextResponse.json({
    ok: true,
    id: entry.id,
  });
}
