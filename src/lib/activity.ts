import { prisma } from "@/lib/db";

export async function logActivity(params: {
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? undefined,
      metadata: params.metadata as object | undefined,
    },
  });
}
