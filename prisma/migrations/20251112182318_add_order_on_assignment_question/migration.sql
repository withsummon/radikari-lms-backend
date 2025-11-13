/*
  Warnings:

  - A unique constraint covering the columns `[assignmentId,order]` on the table `AssignmentQuestion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order` to the `AssignmentQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AssignmentQuestion" ADD COLUMN     "order" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentQuestion_assignmentId_order_key" ON "public"."AssignmentQuestion"("assignmentId", "order");
