import { prisma } from "@/lib/db";

export async function getDashboardSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [paidMtd, arrearsAgg, openIncidents, activeMaint] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        status: "PAID",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      _sum: { amount: true },
    }),
    prisma.incident.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.maintenanceTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  const revenueMtd = paidMtd._sum.amount ?? 0;

  return {
    revenueMtd,
    arrearsTotal: arrearsAgg._sum.amount ?? 0,
    openIncidents,
    activeMaint,
  };
}
