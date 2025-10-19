-- CreateEnum
CREATE TYPE "public"."AiChatRoomMessageSender" AS ENUM ('USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "public"."AiChatRoom" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiChatRoomMessage" (
    "id" TEXT NOT NULL,
    "aiChatRoomId" TEXT NOT NULL,
    "sender" "public"."AiChatRoomMessageSender" NOT NULL,
    "message" TEXT NOT NULL,
    "htmlFormattedMessage" TEXT,
    "knowledgeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatRoomMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiChatRoom_id_key" ON "public"."AiChatRoom"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AiChatRoomMessage_id_key" ON "public"."AiChatRoomMessage"("id");

-- AddForeignKey
ALTER TABLE "public"."AiChatRoom" ADD CONSTRAINT "AiChatRoom_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiChatRoom" ADD CONSTRAINT "AiChatRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiChatRoomMessage" ADD CONSTRAINT "AiChatRoomMessage_aiChatRoomId_fkey" FOREIGN KEY ("aiChatRoomId") REFERENCES "public"."AiChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiChatRoomMessage" ADD CONSTRAINT "AiChatRoomMessage_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "public"."Knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
