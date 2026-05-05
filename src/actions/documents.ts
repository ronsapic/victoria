"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createDocumentMeta(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!title || !category) return;

  const doc = await prisma.documentMeta.create({
    data: { title, category, reference, notes },
  });

  await logActivity({
    action: "upload_meta",
    entity: "document",
    entityId: doc.id,
  });
  revalidatePath("/documents");
}
