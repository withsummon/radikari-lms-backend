-- AlterTable
ALTER TABLE "public"."AssignmentUserAttempt" ADD COLUMN     "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submittedAt" TIMESTAMP(3);
