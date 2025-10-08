/*
  Warnings:

  - You are about to drop the `TenanRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TenanRole" DROP CONSTRAINT "TenanRole_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TenantUser" DROP CONSTRAINT "TenantUser_tenantRoleId_fkey";

-- DropTable
DROP TABLE "public"."TenanRole";

-- CreateTable
CREATE TABLE "public"."TenantRole" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantRole_id_key" ON "public"."TenantRole"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRole_tenantId_identifier_key" ON "public"."TenantRole"("tenantId", "identifier");

-- AddForeignKey
ALTER TABLE "public"."TenantRole" ADD CONSTRAINT "TenantRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUser" ADD CONSTRAINT "TenantUser_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES "public"."TenantRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
