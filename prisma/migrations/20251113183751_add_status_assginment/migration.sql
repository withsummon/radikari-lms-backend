-- CreateEnum
CREATE TYPE "public"."AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "status" "public"."AssignmentStatus" NOT NULL DEFAULT 'DRAFT';
