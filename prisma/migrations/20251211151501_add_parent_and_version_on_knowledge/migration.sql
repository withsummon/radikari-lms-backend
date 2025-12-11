/*
  Warnings:

  - A unique constraint covering the columns `[parentId,version]` on the table `Knowledge` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Knowledge" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Knowledge_parentId_idx" ON "Knowledge"("parentId");

-- CreateIndex
CREATE INDEX "Knowledge_version_parentId_idx" ON "Knowledge"("version", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Knowledge_parentId_version_key" ON "Knowledge"("parentId", "version");

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
