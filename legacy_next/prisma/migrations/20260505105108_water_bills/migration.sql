-- CreateTable
CREATE TABLE "WaterBill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "fromReadingId" TEXT,
    "toReadingId" TEXT,
    "consumption" REAL NOT NULL,
    "ratePerUnit" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaterBill_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WaterBill_unitId_idx" ON "WaterBill"("unitId");

-- CreateIndex
CREATE INDEX "WaterBill_status_idx" ON "WaterBill"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WaterBill_unitId_periodLabel_key" ON "WaterBill"("unitId", "periodLabel");
