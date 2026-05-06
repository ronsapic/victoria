-- CreateTable
CREATE TABLE "AutomationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "runAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ComplianceDeadline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DecisionApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DecisionApproval_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DecisionApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AgreementSigning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agreementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signature" TEXT,
    CONSTRAINT "AgreementSigning_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgreementSigning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VendorContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reference" TEXT,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorContract_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorQuote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorRating_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BudgetDepartment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetDepartment_budgetYearId_fkey" FOREIGN KEY ("budgetYearId") REFERENCES "BudgetYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "planned" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetLine_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "BudgetDepartment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResidentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contactAlt" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResidentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResidentOccupant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResidentOccupant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ResidentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResidentVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "make" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResidentVehicle_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ResidentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParkingSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ParkingAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT NOT NULL,
    "unitId" TEXT,
    "vehiclePlate" TEXT,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    CONSTRAINT "ParkingAssignment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ParkingSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ParkingAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParkingViolation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT,
    "vehiclePlate" TEXT NOT NULL,
    "unitLabel" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParkingViolation_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ParkingSlot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AutomationJob_status_runAt_idx" ON "AutomationJob"("status", "runAt");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionApproval_decisionId_userId_key" ON "DecisionApproval"("decisionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementSigning_agreementId_userId_key" ON "AgreementSigning"("agreementId", "userId");

-- CreateIndex
CREATE INDEX "VendorContract_vendorId_idx" ON "VendorContract"("vendorId");

-- CreateIndex
CREATE INDEX "VendorQuote_vendorId_idx" ON "VendorQuote"("vendorId");

-- CreateIndex
CREATE INDEX "VendorQuote_status_idx" ON "VendorQuote"("status");

-- CreateIndex
CREATE INDEX "VendorRating_vendorId_idx" ON "VendorRating"("vendorId");

-- CreateIndex
CREATE INDEX "ExpenseApproval_expenseId_idx" ON "ExpenseApproval"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetYear_year_key" ON "BudgetYear"("year");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetDepartment_budgetYearId_name_key" ON "BudgetDepartment"("budgetYearId", "name");

-- CreateIndex
CREATE INDEX "BudgetLine_departmentId_idx" ON "BudgetLine"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentProfile_userId_key" ON "ResidentProfile"("userId");

-- CreateIndex
CREATE INDEX "ResidentOccupant_profileId_idx" ON "ResidentOccupant"("profileId");

-- CreateIndex
CREATE INDEX "ResidentVehicle_profileId_idx" ON "ResidentVehicle"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentVehicle_profileId_plate_key" ON "ResidentVehicle"("profileId", "plate");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSlot_code_key" ON "ParkingSlot"("code");

-- CreateIndex
CREATE INDEX "ParkingAssignment_slotId_idx" ON "ParkingAssignment"("slotId");

-- CreateIndex
CREATE INDEX "ParkingAssignment_unitId_idx" ON "ParkingAssignment"("unitId");

-- CreateIndex
CREATE INDEX "ParkingViolation_slotId_idx" ON "ParkingViolation"("slotId");
