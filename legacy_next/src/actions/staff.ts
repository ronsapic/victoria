"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createStaff(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || undefined;
  const email = String(formData.get("email") ?? "").trim() || undefined;
  if (!name || !role) return;

  const s = await prisma.staffMember.create({
    data: { name, role, phone, email },
  });

  await logActivity({ action: "create", entity: "staff", entityId: s.id });
  revalidatePath("/staff");
}
