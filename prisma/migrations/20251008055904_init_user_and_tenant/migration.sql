-- CreateEnum
CREATE TYPE "public"."Roles" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('INTERNAL', 'GOOGLE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "public"."Roles" NOT NULL,
    "type" "public"."UserType" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenanRole" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenanRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantRoleId" TEXT NOT NULL,

    CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "TenantSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "public"."User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_id_key" ON "public"."Tenant"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TenanRole_id_key" ON "public"."TenanRole"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TenanRole_tenantId_identifier_key" ON "public"."TenanRole"("tenantId", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUser_id_key" ON "public"."TenantUser"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUser_userId_tenantId_key" ON "public"."TenantUser"("userId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSetting_id_key" ON "public"."TenantSetting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSetting_tenantId_key_key" ON "public"."TenantSetting"("tenantId", "key");

-- AddForeignKey
ALTER TABLE "public"."TenanRole" ADD CONSTRAINT "TenanRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUser" ADD CONSTRAINT "TenantUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUser" ADD CONSTRAINT "TenantUser_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES "public"."TenanRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUser" ADD CONSTRAINT "TenantUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantSetting" ADD CONSTRAINT "TenantSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
