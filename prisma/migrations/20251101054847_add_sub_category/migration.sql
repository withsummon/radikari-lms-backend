-- CreateTable
CREATE TABLE "public"."MasterKnowledgeSubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterKnowledgeSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterKnowledgeSubCategory_id_key" ON "public"."MasterKnowledgeSubCategory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MasterKnowledgeSubCategory_name_key" ON "public"."MasterKnowledgeSubCategory"("name");
