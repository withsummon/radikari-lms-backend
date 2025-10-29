/*
  Warnings:

  - The values [SYSTEM] on the enum `AiChatRoomMessageSender` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AiChatRoomMessageSender_new" AS ENUM ('USER', 'ASSISTANT');
ALTER TABLE "public"."AiChatRoomMessage" ALTER COLUMN "sender" TYPE "public"."AiChatRoomMessageSender_new" USING ("sender"::text::"public"."AiChatRoomMessageSender_new");
ALTER TYPE "public"."AiChatRoomMessageSender" RENAME TO "AiChatRoomMessageSender_old";
ALTER TYPE "public"."AiChatRoomMessageSender_new" RENAME TO "AiChatRoomMessageSender";
DROP TYPE "public"."AiChatRoomMessageSender_old";
COMMIT;

-- CreateTable
CREATE TABLE "public"."AiChatRoomMessageKnowledge" (
    "id" TEXT NOT NULL,
    "aiChatRoomMessageId" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,

    CONSTRAINT "AiChatRoomMessageKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiChatRoomMessageKnowledge_id_key" ON "public"."AiChatRoomMessageKnowledge"("id");

-- AddForeignKey
ALTER TABLE "public"."AiChatRoomMessageKnowledge" ADD CONSTRAINT "AiChatRoomMessageKnowledge_aiChatRoomMessageId_fkey" FOREIGN KEY ("aiChatRoomMessageId") REFERENCES "public"."AiChatRoomMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiChatRoomMessageKnowledge" ADD CONSTRAINT "AiChatRoomMessageKnowledge_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "public"."Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
