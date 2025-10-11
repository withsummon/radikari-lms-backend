-- CreateTable
CREATE TABLE "public"."MasterKnowledgeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterKnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MasterKnowledgeCase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterKnowledgeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Knowledge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantRoleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "case" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeAttachment" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "attachmentUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeContent" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "KnowledgeContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeContentAttachment" (
    "id" TEXT NOT NULL,
    "knowledgeContentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "attachmentUrl" TEXT NOT NULL,

    CONSTRAINT "KnowledgeContentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterKnowledgeCategory_id_key" ON "public"."MasterKnowledgeCategory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MasterKnowledgeCategory_name_key" ON "public"."MasterKnowledgeCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterKnowledgeCase_id_key" ON "public"."MasterKnowledgeCase"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MasterKnowledgeCase_name_key" ON "public"."MasterKnowledgeCase"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Knowledge_id_key" ON "public"."Knowledge"("id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeAttachment_id_key" ON "public"."KnowledgeAttachment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeContent_id_key" ON "public"."KnowledgeContent"("id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeContent_knowledgeId_order_key" ON "public"."KnowledgeContent"("knowledgeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeContentAttachment_id_key" ON "public"."KnowledgeContentAttachment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeContentAttachment_knowledgeContentId_order_key" ON "public"."KnowledgeContentAttachment"("knowledgeContentId", "order");

-- AddForeignKey
ALTER TABLE "public"."Knowledge" ADD CONSTRAINT "Knowledge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Knowledge" ADD CONSTRAINT "Knowledge_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES "public"."TenantRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeAttachment" ADD CONSTRAINT "KnowledgeAttachment_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "public"."Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeContent" ADD CONSTRAINT "KnowledgeContent_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "public"."Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeContentAttachment" ADD CONSTRAINT "KnowledgeContentAttachment_knowledgeContentId_fkey" FOREIGN KEY ("knowledgeContentId") REFERENCES "public"."KnowledgeContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
