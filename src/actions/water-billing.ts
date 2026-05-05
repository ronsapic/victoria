"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function generateWaterBills(formData: FormData) {
  await requireAnyRole(["accountant"]);

  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const ratePerUnit = Number(formData.get("ratePerUnit"));
  const threshold = Number(formData.get("alertThreshold") ?? 200);
  if (!periodLabel || Number.isNaN(ratePerUnit) || ratePerUnit <= 0) return;

  const units = await prisma.unit.findMany({
    include: {
      waterReadings: { orderBy: { readDate: "desc" }, take: 2 },
    },
  });

  let created = 0;
  let alerts = 0;

  for (const u of units) {
    if (u.waterReadings.length < 2) continue;
    const to = u.waterReadings[0]!;
    const from = u.waterReadings[1]!;
    const consumption = Math.max(0, to.reading - from.reading);

    const amount = consumption * ratePerUnit;

    await prisma.waterBill.upsert({
      where: { unitId_periodLabel: { unitId: u.id, periodLabel } },
      update: {
        fromReadingId: from.id,
        toReadingId: to.id,
        consumption,
        ratePerUnit,
        amount,
      },
      create: {
        unitId: u.id,
        periodLabel,
        fromReadingId: from.id,
        toReadingId: to.id,
        consumption,
        ratePerUnit,
        amount,
        status: "PENDING",
      },
    });
    created++;

    if (Number.isFinite(threshold) && consumption > threshold) {
      alerts++;
      await prisma.activityLog.create({
        data: {
          action: "water_alert",
          entity: "unit",
          entityId: u.id,
          metadata: { periodLabel, consumption, threshold },
        },
      });
    }
  }

  await logActivity({
    action: "generate_water_bills",
    entity: "water",
    metadata: { periodLabel, created, alerts, ratePerUnit },
  });

  revalidatePath("/water");
  revalidatePath("/reports");
  revalidatePath("/activity");
}

