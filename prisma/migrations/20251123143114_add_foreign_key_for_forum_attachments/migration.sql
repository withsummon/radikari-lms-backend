-- AddForeignKey
ALTER TABLE "ForumAttachment" ADD CONSTRAINT "ForumAttachment_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
