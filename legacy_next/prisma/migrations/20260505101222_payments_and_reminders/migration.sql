-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "ReminderJob_unitId_idx" ON "ReminderJob"("unitId");

-- CreateIndex
CREATE INDEX "ReminderJob_status_idx" ON "ReminderJob"("status");
