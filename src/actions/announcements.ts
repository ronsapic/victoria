"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";

export async function createAnnouncement(formData: FormData) {
  await requireAnyRole(["admin"]);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all").trim();

  if (!title || !body) return;

  const a = await prisma.announcement.create({
    data: { title, body, audience },
  });

  await logActivity({
    action: "announce",
    entity: "announcement",
    entityId: a.id,
  });
  revalidatePath("/communications");
}
