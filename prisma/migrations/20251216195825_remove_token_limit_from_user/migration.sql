/*
  Warnings:

  - You are about to drop the column `tokenLimit` on the `UserActivityLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserActivityLog" DROP COLUMN "tokenLimit";
