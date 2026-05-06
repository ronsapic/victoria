"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";

export async function createUnit(formData: FormData) {
  await requireAnyRole(["staff"]);
  const number = String(formData.get("number") ?? "").trim();
  const floor = Number(formData.get("floor"));
  const sizeSqmRaw = formData.get("sizeSqm");
  const ownership = Number(formData.get("ownershipSharePct") ?? 100);
  if (!number || Number.isNaN(floor)) return;

  await prisma.unit.create({
    data: {
      number,
      floor,
      sizeSqm: sizeSqmRaw ? Number(sizeSqmRaw) : undefined,
      ownershipSharePct:
        Number.isFinite(ownership) && ownership > 0 ? ownership : 100,
    },
  });

  await logActivity({ action: "create", entity: "unit" });
  revalidatePath("/units");
}

export async function updateUnit(formData: FormData) {
  await requireAnyRole(["staff"]);
  const id = String(formData.get("id") ?? "");
  const number = String(formData.get("number") ?? "").trim();
  const floor = Number(formData.get("floor"));
  const sizeSqmRaw = formData.get("sizeSqm");
  const ownership = Number(formData.get("ownershipSharePct") ?? 100);
  if (!id || !number || Number.isNaN(floor)) return;

  await prisma.unit.update({
    where: { id },
    data: {
      number,
      floor,
      sizeSqm: sizeSqmRaw ? Number(sizeSqmRaw) : null,
      ownershipSharePct:
        Number.isFinite(ownership) && ownership > 0 ? ownership : 100,
    },
  });

  await logActivity({ action: "update", entity: "unit", entityId: id });
  revalidatePath("/units");
  revalidatePath(`/units/${id}`);
}

export async function deleteUnit(formData: FormData) {
  await requireAnyRole(["staff"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.unit.delete({ where: { id } });
  await logActivity({ action: "delete", entity: "unit", entityId: id });
  revalidatePath("/units");
  redirect("/units");
}
