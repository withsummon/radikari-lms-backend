/*
  Warnings:

  - A unique constraint covering the columns `[identifier,tenantId]` on the table `TenantRole` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TenantRole_identifier_key";

-- AlterTable
ALTER TABLE "TenantRole" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TenantRole_identifier_tenantId_key" ON "TenantRole"("identifier", "tenantId");

-- AddForeignKey
ALTER TABLE "TenantRole" ADD CONSTRAINT "TenantRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
