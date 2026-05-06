"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function logVisitor(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const unitVisit = String(formData.get("unitVisit") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!name || !phone || !unitVisit) return;

  const entry = await prisma.visitorEntry.create({
    data: { name, phone, unitVisit, notes },
  });

  await logActivity({
    action: "visitor_in",
    entity: "visitor",
    entityId: entry.id,
  });
  revalidatePath("/visitors");
}
