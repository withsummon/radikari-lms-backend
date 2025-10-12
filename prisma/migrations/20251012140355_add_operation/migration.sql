/*
  Warnings:

  - Added the required column `operationId` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "operationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."TenantUser" ADD COLUMN     "headOfOperationUserId" TEXT,
ADD COLUMN     "managerUserId" TEXT,
ADD COLUMN     "supervisorUserId" TEXT,
ADD COLUMN     "teamLeaderUserId" TEXT;

-- CreateTable
CREATE TABLE "public"."Operation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "headOfOperationUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Operation_id_key" ON "public"."Operation"("id");

-- AddForeignKey
ALTER TABLE "public"."Operation" ADD CONSTRAINT "Operation_headOfOperationUserId_fkey" FOREIGN KEY ("headOfOperationUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tenant" ADD CONSTRAINT "Tenant_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "public"."Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUser" ADD CONSTRAINT "TenantUser_teamLeaderUserId_fkey" FOREIGN KEY ("teamLeaderUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUser" ADD CONSTRAINT "TenantUser_supervisorUserId_fkey" FOREIGN KEY ("supervisorUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUser" ADD CONSTRAINT "TenantUser_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUser" ADD CONSTRAINT "TenantUser_headOfOperationUserId_fkey" FOREIGN KEY ("headOfOperationUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
