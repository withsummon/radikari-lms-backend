-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "lastRevisionByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_lastRevisionByUserId_fkey" FOREIGN KEY ("lastRevisionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
