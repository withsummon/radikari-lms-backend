/*
  Warnings:

  - You are about to drop the column `tenantId` on the `TenantRole` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identifier]` on the table `TenantRole` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "TenantRole" DROP CONSTRAINT "TenantRole_tenantId_fkey";

-- DropIndex
DROP INDEX "TenantRole_identifier_tenantId_key";

-- AlterTable
ALTER TABLE "AssignmentUserAttemptQuestionAnswer" ADD COLUMN     "aiGradingReasoning" TEXT;

-- AlterTable
ALTER TABLE "TenantRole" DROP COLUMN "tenantId";

-- CreateIndex
CREATE UNIQUE INDEX "TenantRole_identifier_key" ON "TenantRole"("identifier");
