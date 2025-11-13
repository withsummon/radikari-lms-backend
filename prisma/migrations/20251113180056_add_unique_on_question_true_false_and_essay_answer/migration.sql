/*
  Warnings:

  - A unique constraint covering the columns `[assignmentQuestionId]` on the table `AssignmentQuestionEssayReferenceAnswer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assignmentQuestionId]` on the table `AssignmentQuestionTrueFalseAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AssignmentQuestionEssayReferenceAnswer_assignmentQuestionId_key" ON "public"."AssignmentQuestionEssayReferenceAnswer"("assignmentQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentQuestionTrueFalseAnswer_assignmentQuestionId_key" ON "public"."AssignmentQuestionTrueFalseAnswer"("assignmentQuestionId");
