/*
  Warnings:

  - You are about to drop the column `fileName` on the `ResumeDocument` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[objectKey]` on the table `ResumeDocument` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `originalName` to the `ResumeDocument` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PARSED', 'FAILED');

-- AlterTable
ALTER TABLE "ResumeDocument" DROP COLUMN "fileName",
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED';

-- CreateIndex
CREATE UNIQUE INDEX "ResumeDocument_objectKey_key" ON "ResumeDocument"("objectKey");
