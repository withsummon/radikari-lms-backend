-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementTenantRoleAccess" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "tenantRoleId" TEXT NOT NULL,

    CONSTRAINT "AnnouncementTenantRoleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_id_key" ON "Announcement"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementTenantRoleAccess_id_key" ON "AnnouncementTenantRoleAccess"("id");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementTenantRoleAccess" ADD CONSTRAINT "AnnouncementTenantRoleAccess_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementTenantRoleAccess" ADD CONSTRAINT "AnnouncementTenantRoleAccess_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES "TenantRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
