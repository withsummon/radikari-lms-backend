/*
  Warnings:

  - You are about to drop the column `tenantRoleId` on the `Knowledge` table. All the data in the column will be lost.
  - Added the required column `access` to the `Knowledge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Knowledge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."KnowledgeAccess" AS ENUM ('PUBLIC', 'TENANT', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."KnowledgeType" AS ENUM ('ARTICLE', 'CASE');

-- DropForeignKey
ALTER TABLE "public"."Knowledge" DROP CONSTRAINT "Knowledge_tenantRoleId_fkey";

-- AlterTable
ALTER TABLE "public"."Knowledge" DROP COLUMN "tenantRoleId",
ADD COLUMN     "access" "public"."KnowledgeAccess" NOT NULL,
ADD COLUMN     "type" "public"."KnowledgeType" NOT NULL,
ALTER COLUMN "tenantId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."UserKnowledge" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserKnowledge_id_key" ON "public"."UserKnowledge"("id");

-- AddForeignKey
ALTER TABLE "public"."UserKnowledge" ADD CONSTRAINT "UserKnowledge_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "public"."Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserKnowledge" ADD CONSTRAINT "UserKnowledge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
