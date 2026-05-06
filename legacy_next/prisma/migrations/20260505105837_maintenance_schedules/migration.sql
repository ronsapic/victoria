-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "intervalDays" INTEGER NOT NULL,
    "nextRunAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "unitId" TEXT,
    "assetId" TEXT,
    "assignee" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceSchedule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaintenanceTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "costEstimate" REAL,
    "costActual" REAL,
    "contractor" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceTicket_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceTicket_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MaintenanceTicket" ("completedAt", "contractor", "costActual", "costEstimate", "createdAt", "description", "id", "status", "title", "unitId", "updatedAt") SELECT "completedAt", "contractor", "costActual", "costEstimate", "createdAt", "description", "id", "status", "title", "unitId", "updatedAt" FROM "MaintenanceTicket";
DROP TABLE "MaintenanceTicket";
ALTER TABLE "new_MaintenanceTicket" RENAME TO "MaintenanceTicket";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_active_nextRunAt_idx" ON "MaintenanceSchedule"("active", "nextRunAt");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_unitId_idx" ON "MaintenanceSchedule"("unitId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_assetId_idx" ON "MaintenanceSchedule"("assetId");
