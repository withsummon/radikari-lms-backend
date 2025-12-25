/*
  Warnings:

  - Made the column `tenantId` on table `TenantRole` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TenantRole" ALTER COLUMN "tenantId" SET NOT NULL;
