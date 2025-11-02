/*
  Warnings:

  - You are about to drop the column `tenantId` on the `TenantRole` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identifier]` on the table `TenantRole` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."TenantRole" DROP CONSTRAINT "TenantRole_tenantId_fkey";

-- DropIndex
DROP INDEX "public"."TenantRole_tenantId_identifier_key";

-- AlterTable
ALTER TABLE "public"."TenantRole" DROP COLUMN "tenantId";

-- CreateTable
CREATE TABLE "public"."AccessControlList" (
    "id" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "actionName" TEXT NOT NULL,
    "tenantRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "AccessControlList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AclFeature" (
    "name" TEXT NOT NULL,
    "isDeletable" BOOLEAN NOT NULL DEFAULT true,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."AclAction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "isDeletable" BOOLEAN NOT NULL DEFAULT true,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AclAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessControlList_id_key" ON "public"."AccessControlList"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AccessControlList_featureName_actionName_tenantRoleId_key" ON "public"."AccessControlList"("featureName", "actionName", "tenantRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "AclFeature_name_key" ON "public"."AclFeature"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AclAction_id_key" ON "public"."AclAction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AclAction_featureName_name_key" ON "public"."AclAction"("featureName", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRole_identifier_key" ON "public"."TenantRole"("identifier");

-- AddForeignKey
ALTER TABLE "public"."AccessControlList" ADD CONSTRAINT "AccessControlList_featureName_fkey" FOREIGN KEY ("featureName") REFERENCES "public"."AclFeature"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccessControlList" ADD CONSTRAINT "AccessControlList_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES "public"."TenantRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccessControlList" ADD CONSTRAINT "AccessControlList_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccessControlList" ADD CONSTRAINT "AccessControlList_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AclAction" ADD CONSTRAINT "AclAction_featureName_fkey" FOREIGN KEY ("featureName") REFERENCES "public"."AclFeature"("name") ON DELETE CASCADE ON UPDATE CASCADE;
