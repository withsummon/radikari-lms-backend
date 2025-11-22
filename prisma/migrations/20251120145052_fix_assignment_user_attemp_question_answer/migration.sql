/*
  Warnings:

  - You are about to drop the `AssignmentUserAttemptEssayAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssignmentUserAttemptOptionAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssignmentUserAttemptTrueFalseAnswer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AssignmentUserAttemptEssayAnswer" DROP CONSTRAINT "AssignmentUserAttemptEssayAnswer_assignmentQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentUserAttemptEssayAnswer" DROP CONSTRAINT "AssignmentUserAttemptEssayAnswer_assignmentUserAttemptId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentUserAttemptEssayAnswer" DROP CONSTRAINT "AssignmentUserAttemptEssayAnswer_gradedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentUserAttemptOptionAnswer" DROP CONSTRAINT "AssignmentUserAttemptOptionAnswer_assignmentQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentUserAttemptOptionAnswer" DROP CONSTRAINT "AssignmentUserAttemptOptionAnswer_assignmentQuestionOption_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentUserAttemptOptionAnswer" DROP CONSTRAINT "AssignmentUserAttemptOptionAnswer_assignmentUserAttemptId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentUserAttemptTrueFalseAnswer" DROP CONSTRAINT "AssignmentUserAttemptTrueFalseAnswer_assignmentQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentUserAttemptTrueFalseAnswer" DROP CONSTRAINT "AssignmentUserAttemptTrueFalseAnswer_assignmentUserAttempt_fkey";

-- DropTable
DROP TABLE "AssignmentUserAttemptEssayAnswer";

-- DropTable
DROP TABLE "AssignmentUserAttemptOptionAnswer";

-- DropTable
DROP TABLE "AssignmentUserAttemptTrueFalseAnswer";

-- CreateTable
CREATE TABLE "AssignmentUserAttemptQuestionAnswer" (
    "id" TEXT NOT NULL,
    "type" "AssignmentQuestionType" NOT NULL,
    "assignmentUserAttemptId" TEXT NOT NULL,
    "assignmentQuestionId" TEXT NOT NULL,
    "assignmentQuestionOptionId" TEXT,
    "essayAnswer" TEXT,
    "isAnswerCorrect" BOOLEAN,
    "graderComment" TEXT,
    "gradedByUserId" TEXT,
    "trueFalseAnswer" BOOLEAN,

    CONSTRAINT "AssignmentUserAttemptQuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttemptQuestionAnswer_id_key" ON "AssignmentUserAttemptQuestionAnswer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttemptQuestionAnswer_assignmentUserAttemptId_key" ON "AssignmentUserAttemptQuestionAnswer"("assignmentUserAttemptId", "assignmentQuestionId");

-- AddForeignKey
ALTER TABLE "AssignmentUserAttemptQuestionAnswer" ADD CONSTRAINT "AssignmentUserAttemptQuestionAnswer_assignmentUserAttemptI_fkey" FOREIGN KEY ("assignmentUserAttemptId") REFERENCES "AssignmentUserAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentUserAttemptQuestionAnswer" ADD CONSTRAINT "AssignmentUserAttemptQuestionAnswer_assignmentQuestionId_fkey" FOREIGN KEY ("assignmentQuestionId") REFERENCES "AssignmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentUserAttemptQuestionAnswer" ADD CONSTRAINT "AssignmentUserAttemptQuestionAnswer_assignmentQuestionOpti_fkey" FOREIGN KEY ("assignmentQuestionOptionId") REFERENCES "AssignmentQuestionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentUserAttemptQuestionAnswer" ADD CONSTRAINT "AssignmentUserAttemptQuestionAnswer_gradedByUserId_fkey" FOREIGN KEY ("gradedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
