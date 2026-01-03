-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssignmentStatus" ADD VALUE 'PENDING';
ALTER TYPE "AssignmentStatus" ADD VALUE 'APPROVED';
ALTER TYPE "AssignmentStatus" ADD VALUE 'REVISION';
ALTER TYPE "AssignmentStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "rejectionComment" TEXT;

-- AlterTable
ALTER TABLE "AssignmentQuestion" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 1;
