"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createAsset(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const conditionNote =
    String(formData.get("conditionNote") ?? "").trim() || undefined;
  const lastRaw = formData.get("lastServiceAt");

  if (!name || !category) return;

  await prisma.asset.create({
    data: {
      name,
      category,
      conditionNote,
      lastServiceAt: lastRaw
        ? new Date(String(lastRaw))
        : undefined,
    },
  });

  await logActivity({ action: "create", entity: "asset" });
  revalidatePath("/assets");
}
