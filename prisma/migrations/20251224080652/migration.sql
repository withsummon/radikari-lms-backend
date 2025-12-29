-- CreateEnum
CREATE TYPE "KnowledgeReadStatus" AS ENUM ('NOT_VIEWED', 'VIEWED');

-- CreateTable
CREATE TABLE "UserKnowledgeReadLog" (
    "id" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KnowledgeReadStatus" NOT NULL DEFAULT 'NOT_VIEWED',
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserKnowledgeReadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserKnowledgeReadLog_id_key" ON "UserKnowledgeReadLog"("id");

-- CreateIndex
CREATE INDEX "UserKnowledgeReadLog_knowledgeId_idx" ON "UserKnowledgeReadLog"("knowledgeId");

-- CreateIndex
CREATE INDEX "UserKnowledgeReadLog_userId_idx" ON "UserKnowledgeReadLog"("userId");

-- CreateIndex
CREATE INDEX "UserKnowledgeReadLog_lastViewedAt_idx" ON "UserKnowledgeReadLog"("lastViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserKnowledgeReadLog_knowledgeId_userId_key" ON "UserKnowledgeReadLog"("knowledgeId", "userId");

-- AddForeignKey
ALTER TABLE "UserKnowledgeReadLog" ADD CONSTRAINT "UserKnowledgeReadLog_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKnowledgeReadLog" ADD CONSTRAINT "UserKnowledgeReadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
