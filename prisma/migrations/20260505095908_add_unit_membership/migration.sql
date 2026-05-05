-- CreateTable
CREATE TABLE "UnitMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    CONSTRAINT "UnitMembership_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UnitMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UnitMembership_unitId_idx" ON "UnitMembership"("unitId");

-- CreateIndex
CREATE INDEX "UnitMembership_userId_idx" ON "UnitMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitMembership_unitId_userId_kind_startDate_key" ON "UnitMembership"("unitId", "userId", "kind", "startDate");
