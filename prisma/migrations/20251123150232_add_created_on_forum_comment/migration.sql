/*
  Warnings:

  - Added the required column `updatedAt` to the `ForumComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ForumComment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ForumCommentLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "forumCommentId" TEXT NOT NULL,

    CONSTRAINT "ForumCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ForumCommentLike_id_key" ON "ForumCommentLike"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCommentLike_userId_forumCommentId_key" ON "ForumCommentLike"("userId", "forumCommentId");

-- AddForeignKey
ALTER TABLE "ForumCommentLike" ADD CONSTRAINT "ForumCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumCommentLike" ADD CONSTRAINT "ForumCommentLike_forumCommentId_fkey" FOREIGN KEY ("forumCommentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
