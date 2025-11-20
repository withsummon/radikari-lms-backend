/*
  Warnings:

  - A unique constraint covering the columns `[assignmentUserAttemptId,assignmentQuestionId]` on the table `AssignmentUserAttemptEssayAnswer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assignmentUserAttemptId,assignmentQuestionId]` on the table `AssignmentUserAttemptOptionAnswer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assignmentUserAttemptId,assignmentQuestionId]` on the table `AssignmentUserAttemptTrueFalseAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttemptEssayAnswer_assignmentUserAttemptId_as_key" ON "AssignmentUserAttemptEssayAnswer"("assignmentUserAttemptId", "assignmentQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttemptOptionAnswer_assignmentUserAttemptId_a_key" ON "AssignmentUserAttemptOptionAnswer"("assignmentUserAttemptId", "assignmentQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttemptTrueFalseAnswer_assignmentUserAttemptI_key" ON "AssignmentUserAttemptTrueFalseAnswer"("assignmentUserAttemptId", "assignmentQuestionId");
