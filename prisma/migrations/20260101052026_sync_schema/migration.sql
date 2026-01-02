/*
  Warnings:

  - Made the column `score` on table `AssignmentUserAttempt` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "isRandomized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showAnswer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showQuestion" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AssignmentUserAttempt" ADD COLUMN     "randomSeed" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "score" SET DEFAULT 0;

-- Note: The "isActive" column on "User" table already exists in the database
-- This migration was updated to skip adding it since it's already present
