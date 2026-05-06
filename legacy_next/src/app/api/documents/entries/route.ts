import { NextResponse } from "next/server";

import { logActivity } from "@/lib/activity";
import {
  groupDocumentSeries,
  serializeEntry,
} from "@/lib/documents/group-series";
import { getSessionUser } from "@/lib/auth/session";
import { isCommitteeRole } from "@/lib/files/stored-file-access";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ELEVATED = new Set(["admin", "auditor", "accountant", "staff"]);

function normalizeSeriesKey(raw: string): string | undefined {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return s.length > 0 ? s : undefined;
}

/** List registry entries; residents only see RESIDENTS visibility. Includes version series. */
export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = ELEVATED.has(user.role)
    ? {}
    : { visibility: "RESIDENTS" as const };

  const rows = await prisma.documentEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
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

  const grouped = groupDocumentSeries(rows).map((g) => ({
    seriesKey: g.seriesKey,
    category: g.category,
    displayTitle: g.displayTitle,
    versions: g.versions.map(serializeEntry),
  }));

  const categories = new Set<string>();
  for (const e of rows) {
    categories.add(e.category);
  }

  return NextResponse.json({
    entries: rows.map(serializeEntry),
    series: grouped,
    segments: [...categories].sort(),
  });
}

/** Attach metadata to an already-uploaded DOCUMENT file (committee; MANAGEMENT = admin only). */
export async function POST(req: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCommitteeRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    fileId?: string;
    title?: string;
    category?: string;
    visibility?: string;
    seriesKey?: string;
    versionNote?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fileId = String(body.fileId ?? "").trim();
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "").trim().toUpperCase();
  const visibilityRaw = String(body.visibility ?? "PRIVATE").toUpperCase();
  const seriesKey = normalizeSeriesKey(String(body.seriesKey ?? ""));
  const versionNote =
    String(body.versionNote ?? "")
      .trim()
      .slice(0, 200) || undefined;

  if (!fileId || !title || !category) {
    return NextResponse.json(
      { error: "fileId, title, and category are required" },
      { status: 400 },
    );
  }

  if (category === "MANAGEMENT" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins may publish management documents" },
      { status: 403 },
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
      seriesKey: seriesKey ?? null,
      versionNote: versionNote ?? null,
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
    metadata: { category, visibility, title, seriesKey, versionNote },
  });

  return NextResponse.json({
    ok: true,
    id: entry.id,
  });
}
