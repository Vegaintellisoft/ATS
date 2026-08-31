/*
  Warnings:

  - You are about to drop the column `assignedRecruiterId` on the `CandidateProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'HIRED');

-- DropForeignKey
ALTER TABLE "CandidateProfile" DROP CONSTRAINT "CandidateProfile_assignedRecruiterId_fkey";

-- AlterTable
ALTER TABLE "CandidateProfile" DROP COLUMN "assignedRecruiterId",
ADD COLUMN     "assignedManagerId" TEXT,
ADD COLUMN     "status" "CandidateStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_assignedManagerId_fkey" FOREIGN KEY ("assignedManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
