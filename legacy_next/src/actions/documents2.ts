"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createDocumentEntry(formData: FormData) {
  await requireAnyRole(["auditor"]);

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "PRIVATE").toUpperCase();
  const fileId = String(formData.get("fileId") ?? "").trim();

  if (!title || !category || !fileId) return;

  const entry = await prisma.documentEntry.create({
    data: {
      title,
      category,
      visibility: visibility === "RESIDENTS" ? "RESIDENTS" : "PRIVATE",
      fileId,
    },
  });

  await logActivity({
    action: "create",
    entity: "document_entry",
    entityId: entry.id,
    metadata: { category, visibility: entry.visibility },
  });
  revalidatePath("/documents");
}

