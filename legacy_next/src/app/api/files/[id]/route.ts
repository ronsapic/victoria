import fs from "node:fs/promises";

import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { isCommitteeRole } from "@/lib/files/stored-file-access";
import { prisma } from "@/lib/db";
import { storedFilePath } from "@/lib/storage/paths";

export const runtime = "nodejs";

function canDeleteStoredFile(
  user: { id: string; role: string },
  f: { category: string; uploadedById: string | null },
): boolean {
  if (f.category === "RECEIPT") {
    return (
      f.uploadedById === user.id ||
      isCommitteeRole(user.role) ||
      user.role === "staff"
    );
  }
  if (f.category === "DOCUMENT") {
    return isCommitteeRole(user.role) || user.role === "staff";
  }
  return (
    f.uploadedById === user.id ||
    isCommitteeRole(user.role) ||
    user.role === "staff"
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const f = await prisma.storedFile.findUnique({ where: { id } });
  if (!f) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canDeleteStoredFile(user, f)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await fs.unlink(storedFilePath(f.storagePath));
  } catch {
    // still remove DB row if blob is missing
  }

  await prisma.storedFile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
