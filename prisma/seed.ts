import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const u1 = await prisma.unit.create({
    data: {
      number: "A-101",
      floor: 1,
      sizeSqm: 78,
      ownershipSharePct: 100,
    },
  });

  await prisma.unit.create({
    data: {
      number: "B-204",
      floor: 2,
      sizeSqm: 92,
      ownershipSharePct: 50,
    },
  });

  await prisma.incident.create({
    data: {
      unitId: u1.id,
      title: "Lobby light flickering",
      description: "Fixture near lifts flashes after 9pm.",
      category: "Electrical",
      status: "OPEN",
      assignee: "Maintenance",
    },
  });

  await prisma.maintenanceTicket.create({
    data: {
      unitId: u1.id,
      title: "Annual pump inspection",
      description: "Check pressure and valves.",
      status: "IN_PROGRESS",
      contractor: "HydroServe",
      costEstimate: 450,
    },
  });

  await prisma.invoice.createMany({
    data: [
      {
        unitId: u1.id,
        periodLabel: "2026-05",
        amount: 285000,
        status: "PENDING",
        dueDate: new Date("2026-05-28"),
      },
      {
        unitId: u1.id,
        periodLabel: "2026-04",
        amount: 280000,
        status: "PAID",
        dueDate: new Date("2026-04-28"),
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      {
        category: "MAINTENANCE",
        amount: 120000,
        description: "Generator service",
        occurredAt: new Date("2026-05-01"),
      },
      {
        category: "UTILITIES",
        amount: 890000,
        description: "Electricity bulk meter",
        occurredAt: new Date("2026-05-02"),
      },
    ],
  });

  await prisma.announcement.create({
    data: {
      title: "Water shutdown — Sunday",
      body: "Planned outage 08:00–12:00 for tank cleaning.",
      audience: "all",
    },
  });

  await prisma.waterReading.createMany({
    data: [
      { unitId: u1.id, readDate: new Date("2026-03-31"), reading: 420 },
      { unitId: u1.id, readDate: new Date("2026-04-30"), reading: 512 },
    ],
  });

  const poll = await prisma.poll.create({
    data: {
      title: "Approve facade repaint contractor?",
      description: "Select preferred vendor for committee decision.",
      options: {
        create: [{ label: "BrightCoat Ltd" }, { label: "UrbanPaint Co" }],
      },
    },
  });

  await prisma.staffMember.createMany({
    data: [
      { name: "J. Mkama", role: "caretaker", phone: "+255700000001" },
      { name: "R. Yusuf", role: "security", phone: "+255700000002" },
    ],
  });

  await prisma.emergencyContact.createMany({
    data: [
      { label: "Estate emergency line", phone: "+255709111222", priority: 0 },
      { label: "Fire service", phone: "+255114", priority: 1 },
    ],
  });

  await prisma.activityLog.create({
    data: {
      action: "seed",
      entity: "database",
      metadata: { pollId: poll.id },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
