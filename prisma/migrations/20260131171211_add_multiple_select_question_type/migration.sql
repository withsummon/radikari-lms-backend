/*
  Warnings:

  - A unique constraint covering the columns `[subCategoryId,name]` on the table `MasterKnowledgeCase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `MasterKnowledgeCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryId,name]` on the table `MasterKnowledgeSubCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
DO $$ BEGIN
    ALTER TYPE "AssignmentQuestionType" ADD VALUE 'MULTIPLE_SELECT';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "MasterKnowledgeCase_name_key";

-- DropIndex
DROP INDEX IF EXISTS "MasterKnowledgeCategory_name_key";

-- DropIndex
DROP INDEX IF EXISTS "MasterKnowledgeSubCategory_name_key";

-- AlterTable
ALTER TABLE "MasterKnowledgeCase" ADD COLUMN IF NOT EXISTS "subCategoryId" TEXT,
ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- AlterTable
ALTER TABLE "MasterKnowledgeCategory" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- AlterTable
ALTER TABLE "MasterKnowledgeSubCategory" ADD COLUMN IF NOT EXISTS "categoryId" TEXT,
ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AssignmentUserAttemptQuestionAnswerOption" (
    "id" TEXT NOT NULL,
    "assignmentUserAttemptQuestionAnswerId" TEXT NOT NULL,
    "assignmentQuestionOptionId" TEXT NOT NULL,

    CONSTRAINT "AssignmentUserAttemptQuestionAnswerOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KnowledgeShare" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "sharedByUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KnowledgeShareRecipient" (
    "id" TEXT NOT NULL,
    "knowledgeShareId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientUserId" TEXT,

    CONSTRAINT "KnowledgeShareRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AssignmentUserAttemptQuestionAnswerOption_id_key" ON "AssignmentUserAttemptQuestionAnswerOption"("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AssignmentUserAttemptQuestionAnswerOption_assignmentUserAtt_key" ON "AssignmentUserAttemptQuestionAnswerOption"("assignmentUserAttemptQuestionAnswerId", "assignmentQuestionOptionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeShare_id_key" ON "KnowledgeShare"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeShare_sharedByUserId_idx" ON "KnowledgeShare"("sharedByUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeShare_knowledgeId_idx" ON "KnowledgeShare"("knowledgeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeShareRecipient_id_key" ON "KnowledgeShareRecipient"("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeShareRecipient_knowledgeShareId_idx" ON "KnowledgeShareRecipient"("knowledgeShareId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeShareRecipient_recipientUserId_idx" ON "KnowledgeShareRecipient"("recipientUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasterKnowledgeCase_tenantId_idx" ON "MasterKnowledgeCase"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasterKnowledgeCase_subCategoryId_idx" ON "MasterKnowledgeCase"("subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MasterKnowledgeCase_subCategoryId_name_key" ON "MasterKnowledgeCase"("subCategoryId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasterKnowledgeCategory_tenantId_idx" ON "MasterKnowledgeCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MasterKnowledgeCategory_tenantId_name_key" ON "MasterKnowledgeCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasterKnowledgeSubCategory_tenantId_idx" ON "MasterKnowledgeSubCategory"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasterKnowledgeSubCategory_categoryId_idx" ON "MasterKnowledgeSubCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MasterKnowledgeSubCategory_categoryId_name_key" ON "MasterKnowledgeSubCategory"("categoryId", "name");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MasterKnowledgeCategory_tenantId_fkey') THEN
        ALTER TABLE "MasterKnowledgeCategory" ADD CONSTRAINT "MasterKnowledgeCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MasterKnowledgeSubCategory_tenantId_fkey') THEN
        ALTER TABLE "MasterKnowledgeSubCategory" ADD CONSTRAINT "MasterKnowledgeSubCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MasterKnowledgeSubCategory_categoryId_fkey') THEN
        ALTER TABLE "MasterKnowledgeSubCategory" ADD CONSTRAINT "MasterKnowledgeSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MasterKnowledgeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MasterKnowledgeCase_tenantId_fkey') THEN
        ALTER TABLE "MasterKnowledgeCase" ADD CONSTRAINT "MasterKnowledgeCase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MasterKnowledgeCase_subCategoryId_fkey') THEN
        ALTER TABLE "MasterKnowledgeCase" ADD CONSTRAINT "MasterKnowledgeCase_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "MasterKnowledgeSubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AssignmentUserAttemptQuestionAnswerOption_assignmentUserAt_fkey') THEN
        ALTER TABLE "AssignmentUserAttemptQuestionAnswerOption" ADD CONSTRAINT "AssignmentUserAttemptQuestionAnswerOption_assignmentUserAt_fkey" FOREIGN KEY ("assignmentUserAttemptQuestionAnswerId") REFERENCES "AssignmentUserAttemptQuestionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AssignmentUserAttemptQuestionAnswerOption_assignmentQuesti_fkey') THEN
        ALTER TABLE "AssignmentUserAttemptQuestionAnswerOption" ADD CONSTRAINT "AssignmentUserAttemptQuestionAnswerOption_assignmentQuesti_fkey" FOREIGN KEY ("assignmentQuestionOptionId") REFERENCES "AssignmentQuestionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeShare_knowledgeId_fkey') THEN
        ALTER TABLE "KnowledgeShare" ADD CONSTRAINT "KnowledgeShare_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeShare_sharedByUserId_fkey') THEN
        ALTER TABLE "KnowledgeShare" ADD CONSTRAINT "KnowledgeShare_sharedByUserId_fkey" FOREIGN KEY ("sharedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeShareRecipient_knowledgeShareId_fkey') THEN
        ALTER TABLE "KnowledgeShareRecipient" ADD CONSTRAINT "KnowledgeShareRecipient_knowledgeShareId_fkey" FOREIGN KEY ("knowledgeShareId") REFERENCES "KnowledgeShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeShareRecipient_recipientUserId_fkey') THEN
        ALTER TABLE "KnowledgeShareRecipient" ADD CONSTRAINT "KnowledgeShareRecipient_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
