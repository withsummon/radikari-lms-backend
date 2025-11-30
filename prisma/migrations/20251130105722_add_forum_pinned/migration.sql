-- AlterTable
ALTER TABLE "AiChatRoom" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" SET DEFAULT '';

-- CreateTable
CREATE TABLE "ForumPinned" (
    "id" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPinned_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ForumPinned_id_key" ON "ForumPinned"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ForumPinned_forumId_userId_key" ON "ForumPinned"("forumId", "userId");

-- AddForeignKey
ALTER TABLE "ForumPinned" ADD CONSTRAINT "ForumPinned_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPinned" ADD CONSTRAINT "ForumPinned_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
