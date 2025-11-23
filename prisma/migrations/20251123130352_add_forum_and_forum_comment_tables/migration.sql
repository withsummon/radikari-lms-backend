-- CreateTable
CREATE TABLE "Forum" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Forum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumAttachment" (
    "id" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "attachmentUrl" TEXT NOT NULL,

    CONSTRAINT "ForumAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumComment" (
    "id" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "replyToCommentId" TEXT,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "ForumComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Forum_id_key" ON "Forum"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ForumAttachment_id_key" ON "ForumAttachment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ForumComment_id_key" ON "ForumComment"("id");

-- CreateIndex
CREATE INDEX "ForumComment_forumId_idx" ON "ForumComment"("forumId");

-- CreateIndex
CREATE INDEX "ForumComment_replyToCommentId_idx" ON "ForumComment"("replyToCommentId");

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_replyToCommentId_fkey" FOREIGN KEY ("replyToCommentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
