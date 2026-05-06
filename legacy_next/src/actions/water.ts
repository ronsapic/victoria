"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

const ALERT_ABOVE = 200;

export async function createWaterReading(formData: FormData) {
  const unitId = String(formData.get("unitId") ?? "");
  const readRaw = formData.get("readDate");
  const reading = Number(formData.get("reading"));

  if (!unitId || !readRaw || Number.isNaN(reading)) return;

  await prisma.waterReading.create({
    data: {
      unitId,
      readDate: new Date(String(readRaw)),
      reading,
    },
  });

  const latest = await prisma.waterReading.findMany({
    where: { unitId },
    orderBy: { readDate: "desc" },
    take: 2,
  });
  let delta = 0;
  if (latest.length >= 2) {
    delta = latest[0]!.reading - latest[1]!.reading;
  }

  await logActivity({
    action: "water_reading",
    entity: "unit",
    entityId: unitId,
    metadata: { delta, alert: delta > ALERT_ABOVE },
  });

  revalidatePath("/water");
}
