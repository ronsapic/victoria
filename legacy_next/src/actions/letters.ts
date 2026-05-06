"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createLetter(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const scope = String(formData.get("scope") ?? "all").trim();

  if (!title || !body) return;

  const letter = await prisma.letter.create({
    data: { title, body, scope },
  });

  await logActivity({
    action: "issue_letter",
    entity: "letter",
    entityId: letter.id,
  });
  revalidatePath("/letters");
}
