-- CreateEnum
CREATE TYPE "public"."AssignmentAccess" AS ENUM ('TENANT_ROLE', 'USER');

-- CreateEnum
CREATE TYPE "public"."AssignmentQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'ESSAY', 'TRUE_FALSE');

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationInMinutes" INTEGER NOT NULL,
    "access" "public"."AssignmentAccess" NOT NULL,
    "expiredDate" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentTenantRoleAccess" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "tenantRoleId" TEXT NOT NULL,

    CONSTRAINT "AssignmentTenantRoleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentUserAccess" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AssignmentUserAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentQuestion" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."AssignmentQuestionType" NOT NULL,

    CONSTRAINT "AssignmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentQuestionOption" (
    "id" TEXT NOT NULL,
    "assignmentQuestionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrectAnswer" BOOLEAN NOT NULL,

    CONSTRAINT "AssignmentQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentQuestionTrueFalseAnswer" (
    "id" TEXT NOT NULL,
    "assignmentQuestionId" TEXT NOT NULL,
    "correctAnswer" BOOLEAN NOT NULL,

    CONSTRAINT "AssignmentQuestionTrueFalseAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentQuestionEssayReferenceAnswer" (
    "id" TEXT NOT NULL,
    "assignmentQuestionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "AssignmentQuestionEssayReferenceAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentUserAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentUserAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentUserAttemptOptionAnswer" (
    "id" TEXT NOT NULL,
    "assignmentUserAttemptId" TEXT NOT NULL,
    "assignmentQuestionId" TEXT NOT NULL,
    "assignmentQuestionOptionId" TEXT,
    "isAnswerCorrect" BOOLEAN,

    CONSTRAINT "AssignmentUserAttemptOptionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentUserAttemptEssayAnswer" (
    "id" TEXT NOT NULL,
    "assignmentUserAttemptId" TEXT NOT NULL,
    "assignmentQuestionId" TEXT NOT NULL,
    "content" TEXT,
    "isAnswerCorrect" BOOLEAN,
    "graderComment" TEXT,
    "gradedByUserId" TEXT,

    CONSTRAINT "AssignmentUserAttemptEssayAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentUserAttemptTrueFalseAnswer" (
    "id" TEXT NOT NULL,
    "assignmentUserAttemptId" TEXT NOT NULL,
    "assignmentQuestionId" TEXT NOT NULL,
    "answer" BOOLEAN,

    CONSTRAINT "AssignmentUserAttemptTrueFalseAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_id_key" ON "public"."Assignment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentTenantRoleAccess_id_key" ON "public"."AssignmentTenantRoleAccess"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAccess_id_key" ON "public"."AssignmentUserAccess"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentQuestion_id_key" ON "public"."AssignmentQuestion"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentQuestionOption_id_key" ON "public"."AssignmentQuestionOption"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentQuestionTrueFalseAnswer_id_key" ON "public"."AssignmentQuestionTrueFalseAnswer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentQuestionEssayReferenceAnswer_id_key" ON "public"."AssignmentQuestionEssayReferenceAnswer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttempt_id_key" ON "public"."AssignmentUserAttempt"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttemptOptionAnswer_id_key" ON "public"."AssignmentUserAttemptOptionAnswer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttemptEssayAnswer_id_key" ON "public"."AssignmentUserAttemptEssayAnswer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentUserAttemptTrueFalseAnswer_id_key" ON "public"."AssignmentUserAttemptTrueFalseAnswer"("id");

-- AddForeignKey
ALTER TABLE "public"."AssignmentTenantRoleAccess" ADD CONSTRAINT "AssignmentTenantRoleAccess_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentTenantRoleAccess" ADD CONSTRAINT "AssignmentTenantRoleAccess_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES "public"."TenantRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAccess" ADD CONSTRAINT "AssignmentUserAccess_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAccess" ADD CONSTRAINT "AssignmentUserAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentQuestion" ADD CONSTRAINT "AssignmentQuestion_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentQuestionOption" ADD CONSTRAINT "AssignmentQuestionOption_assignmentQuestionId_fkey" FOREIGN KEY ("assignmentQuestionId") REFERENCES "public"."AssignmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentQuestionTrueFalseAnswer" ADD CONSTRAINT "AssignmentQuestionTrueFalseAnswer_assignmentQuestionId_fkey" FOREIGN KEY ("assignmentQuestionId") REFERENCES "public"."AssignmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentQuestionEssayReferenceAnswer" ADD CONSTRAINT "AssignmentQuestionEssayReferenceAnswer_assignmentQuestionI_fkey" FOREIGN KEY ("assignmentQuestionId") REFERENCES "public"."AssignmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttempt" ADD CONSTRAINT "AssignmentUserAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttempt" ADD CONSTRAINT "AssignmentUserAttempt_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttemptOptionAnswer" ADD CONSTRAINT "AssignmentUserAttemptOptionAnswer_assignmentUserAttemptId_fkey" FOREIGN KEY ("assignmentUserAttemptId") REFERENCES "public"."AssignmentUserAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttemptOptionAnswer" ADD CONSTRAINT "AssignmentUserAttemptOptionAnswer_assignmentQuestionId_fkey" FOREIGN KEY ("assignmentQuestionId") REFERENCES "public"."AssignmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttemptOptionAnswer" ADD CONSTRAINT "AssignmentUserAttemptOptionAnswer_assignmentQuestionOption_fkey" FOREIGN KEY ("assignmentQuestionOptionId") REFERENCES "public"."AssignmentQuestionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttemptEssayAnswer" ADD CONSTRAINT "AssignmentUserAttemptEssayAnswer_assignmentUserAttemptId_fkey" FOREIGN KEY ("assignmentUserAttemptId") REFERENCES "public"."AssignmentUserAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttemptEssayAnswer" ADD CONSTRAINT "AssignmentUserAttemptEssayAnswer_assignmentQuestionId_fkey" FOREIGN KEY ("assignmentQuestionId") REFERENCES "public"."AssignmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttemptEssayAnswer" ADD CONSTRAINT "AssignmentUserAttemptEssayAnswer_gradedByUserId_fkey" FOREIGN KEY ("gradedByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttemptTrueFalseAnswer" ADD CONSTRAINT "AssignmentUserAttemptTrueFalseAnswer_assignmentUserAttempt_fkey" FOREIGN KEY ("assignmentUserAttemptId") REFERENCES "public"."AssignmentUserAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentUserAttemptTrueFalseAnswer" ADD CONSTRAINT "AssignmentUserAttemptTrueFalseAnswer_assignmentQuestionId_fkey" FOREIGN KEY ("assignmentQuestionId") REFERENCES "public"."AssignmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
