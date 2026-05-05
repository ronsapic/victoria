"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createVendor(formData: FormData) {
  await requireAnyRole(["accountant", "auditor"]);
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!name || !category) return;

  const v = await prisma.vendor.create({
    data: { name, category, phone, email, notes },
  });
  await logActivity({ action: "create", entity: "vendor", entityId: v.id });
  revalidatePath("/vendors");
}

export async function addQuote(formData: FormData) {
  await requireAnyRole(["accountant", "auditor"]);
  const vendorId = String(formData.get("vendorId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const reference = String(formData.get("reference") ?? "").trim() || null;
  if (!vendorId || !title || Number.isNaN(amount)) return;
  const q = await prisma.vendorQuote.create({
    data: { vendorId, title, amount, reference },
  });
  await logActivity({ action: "create", entity: "vendor_quote", entityId: q.id });
  revalidatePath("/vendors");
}

export async function setQuoteStatus(formData: FormData) {
  await requireAnyRole(["accountant", "auditor"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").toUpperCase();
  if (!id || !["APPROVED", "REJECTED", "SUBMITTED"].includes(status)) return;
  await prisma.vendorQuote.update({ where: { id }, data: { status } });
  await logActivity({ action: "quote_status", entity: "vendor_quote", entityId: id, metadata: { status } });
  revalidatePath("/vendors");
}

