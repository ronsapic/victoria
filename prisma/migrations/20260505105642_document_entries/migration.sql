-- CreateTable
CREATE TABLE "DocumentEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "fileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentEntry_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DocumentEntry_category_idx" ON "DocumentEntry"("category");

-- CreateIndex
CREATE INDEX "DocumentEntry_visibility_idx" ON "DocumentEntry"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentEntry_fileId_key" ON "DocumentEntry"("fileId");
