/*
  Warnings:

  - You are about to drop the column `completionTokens` on the `AiChatRoomMessage` table. All the data in the column will be lost.
  - You are about to drop the column `promptTokens` on the `AiChatRoomMessage` table. All the data in the column will be lost.
  - You are about to drop the column `totalTokens` on the `AiChatRoomMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AiChatRoomMessage" DROP COLUMN "completionTokens",
DROP COLUMN "promptTokens",
DROP COLUMN "totalTokens";

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "aiChatRoomMessageId" TEXT,
    "action" TEXT NOT NULL,
    "model" TEXT,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageLog_id_key" ON "AiUsageLog"("id");

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_aiChatRoomMessageId_fkey" FOREIGN KEY ("aiChatRoomMessageId") REFERENCES "AiChatRoomMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
