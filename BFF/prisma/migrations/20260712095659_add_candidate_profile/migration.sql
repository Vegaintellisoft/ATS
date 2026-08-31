-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "profile" JSONB NOT NULL,
    "rawText" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_documentId_key" ON "CandidateProfile"("documentId");

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ResumeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
