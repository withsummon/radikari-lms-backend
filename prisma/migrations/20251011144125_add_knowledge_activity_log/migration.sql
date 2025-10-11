/*
  Warnings:

  - Added the required column `createdByUserId` to the `Knowledge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."KnowledgeStatus" AS ENUM ('PENDING', 'APPROVED', 'REVISION', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."KnowledgeActivityLogAction" AS ENUM ('APPROVE', 'REJECT', 'REVISION');

-- AlterTable
ALTER TABLE "public"."Knowledge" ADD COLUMN     "createdByUserId" TEXT NOT NULL,
ADD COLUMN     "status" "public"."KnowledgeStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."KnowledgeActivityLog" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "action" "public"."KnowledgeActivityLogAction" NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeActivityLog_id_key" ON "public"."KnowledgeActivityLog"("id");

-- AddForeignKey
ALTER TABLE "public"."Knowledge" ADD CONSTRAINT "Knowledge_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeActivityLog" ADD CONSTRAINT "KnowledgeActivityLog_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "public"."Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeActivityLog" ADD CONSTRAINT "KnowledgeActivityLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
