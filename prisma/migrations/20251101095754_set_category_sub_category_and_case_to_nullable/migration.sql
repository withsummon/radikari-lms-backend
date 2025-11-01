-- AlterTable
ALTER TABLE "public"."Knowledge" ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "subCategory" DROP NOT NULL,
ALTER COLUMN "case" DROP NOT NULL;
