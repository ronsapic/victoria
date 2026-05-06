import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { logActivity } from "@/lib/activity";
import { getSessionUser } from "@/lib/auth/session";
import { isCommitteeRole } from "@/lib/files/stored-file-access";
import { prisma } from "@/lib/db";
import { storedFilePath, storedFilesRoot } from "@/lib/storage/paths";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  let visibility = String(form.get("visibility") ?? "PRIVATE").toUpperCase();
  let category = String(form.get("category") ?? "GENERAL").toUpperCase();

  if (category === "RECEIPT") {
    if (user.role !== "resident") {
      return NextResponse.json(
        { error: "Only residents may upload payment receipts" },
        { status: 403 },
      );
    }
    visibility = "PRIVATE";
  } else if (category === "DOCUMENT") {
    if (!isCommitteeRole(user.role)) {
      return NextResponse.json(
        { error: "Only committee or finance roles may upload association documents" },
        { status: 403 },
      );
    }
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const ext = path.extname(file.name).slice(0, 12) || "";
  const storagePath = `${sha256}${ext}`;

  await fs.mkdir(storedFilesRoot(), { recursive: true });
  await fs.writeFile(storedFilePath(storagePath), buf);

  const row = await prisma.storedFile.create({
    data: {
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      sha256,
      storagePath,
      visibility: visibility === "RESIDENTS" ? "RESIDENTS" : "PRIVATE",
      category,
      uploadedById: user.id,
    },
  });

  if (category === "RECEIPT") {
    await logActivity({
      action: "receipt_uploaded",
      entity: "stored_file",
      entityId: row.id,
      metadata: {
        originalName: file.name,
        uploadedByEmail: user.email,
        uploadedById: user.id,
        mimeType: file.type || "application/octet-stream",
      },
    });
  }

  return NextResponse.json({ ok: true, fileId: row.id });
}

