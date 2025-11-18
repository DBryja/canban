/*
  Warnings:

  - A unique constraint covering the columns `[projectId,number]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `number` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "number" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Task_projectId_number_key" ON "Task"("projectId", "number");
