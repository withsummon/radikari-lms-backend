/*
  Warnings:

  - A unique constraint covering the columns `[userId,assignmentId]` on the table `AssignmentUserAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttempt_userId_assignmentId_key" ON "AssignmentUserAttempt"("userId", "assignmentId");
