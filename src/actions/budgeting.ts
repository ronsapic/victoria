"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function createBudgetYear(formData: FormData) {
  await requireAnyRole(["accountant", "auditor"]);
  const year = Number(formData.get("year"));
  if (!Number.isFinite(year) || year < 2000) return;

  const y = await prisma.budgetYear.upsert({
    where: { year },
    update: {},
    create: { year },
  });
  await logActivity({ action: "create", entity: "budget_year", entityId: y.id });
  revalidatePath("/budgeting");
}

export async function addBudgetLine(formData: FormData) {
  await requireAnyRole(["accountant", "auditor"]);
  const budgetYearId = String(formData.get("budgetYearId") ?? "");
  const dept = String(formData.get("department") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const planned = Number(formData.get("planned"));
  if (!budgetYearId || !dept || !title || Number.isNaN(planned)) return;

  const department = await prisma.budgetDepartment.upsert({
    where: { budgetYearId_name: { budgetYearId, name: dept } },
    update: {},
    create: { budgetYearId, name: dept },
  });

  const line = await prisma.budgetLine.create({
    data: { departmentId: department.id, title, planned },
  });

  await logActivity({
    action: "create",
    entity: "budget_line",
    entityId: line.id,
    metadata: { dept },
  });
  revalidatePath("/budgeting");
}

