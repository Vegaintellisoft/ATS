import { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";

import { prisma } from "../config/prisma.js";
import { minio } from "../config/minio.js";
import { MAX_BATCH_FILES } from "../middlewares/upload.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const bucket = process.env.MINIO_BUCKET || "ats-resumes";

/* ─────────────────────────────────────────────────────────────
   Helper: process a single resume file through the AI pipeline
   ───────────────────────────────────────────────────────────── */
async function processSingleResume(
  file: Express.Multer.File,
  organizationId: string | null,
  createdById: string
): Promise<{
  success: boolean;
  fileName: string;
  documentId?: string;
  candidateId?: string;
  status?: "PARSED" | "FAILED";
  indexed?: boolean;
  updated?: boolean;
  error?: string;
}> {
  const fileName = file.originalname;
  const ext = fileName.substring(fileName.lastIndexOf("."));
  const objectKey = `resumes/${crypto.randomUUID()}${ext}`;
  let documentId: string | null = null;

  try {
    // 1. Upload resume to MinIO
    await minio.putObject(bucket, objectKey, file.buffer, file.size, {
      "Content-Type": file.mimetype,
    });

    // 2. Store document metadata
    const document = await prisma.resumeDocument.create({
      data: {
        bucket,
        objectKey,
        originalName: fileName,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: "PROCESSING",
      },
    });

    documentId = document.id;

    // 3. Parse resume via AI service
    const profileResponse = await axios.post(`${AI_SERVICE_URL}/parse-resume`, {
      objectKey,
    });

    const profileResult = profileResponse.data as {
      success: boolean;
      profile: any;
      rawText: string;
    };

    // Extract the deterministically computed experience years from
    // the "computed" block that experience.py attaches to the profile.
    const totalExperienceYears: number | null =
      profileResult.profile?.computed?.totalExperienceYears ?? null;

    // 4. Detect duplicate candidate by name + email
    const candidateName = profileResult.profile?.candidate?.name?.trim() || null;
    const candidateEmail = profileResult.profile?.candidate?.email?.trim() || null;

    let existingCandidate = null;

    if (candidateName) {
      const matches = await prisma.candidateProfile.findMany({
        where: {
          profile: {
            path: ["candidate", "name"],
            equals: candidateName,
          },
        },
      });

      if (matches.length > 0 && candidateEmail) {
        existingCandidate =
          matches.find((m: any) => {
            const email = (m.profile as any)?.candidate?.email?.trim();
            return email === candidateEmail;
          }) || matches[0];
      } else if (matches.length > 0) {
        existingCandidate = matches[0];
      }
    }

    let candidate;
    let isUpdate = false;

    if (existingCandidate) {
      // Update existing candidate profile
      const oldDocumentId = existingCandidate.documentId;
      const oldDocument = await prisma.resumeDocument.findUnique({
        where: { id: oldDocumentId },
      });

      candidate = await prisma.candidateProfile.update({
        where: { id: existingCandidate.id },
        data: {
          documentId: document.id,
          profile: profileResult.profile,
          rawText: profileResult.rawText,
          version: { increment: 1 },
          totalExperienceYears,
          assignedManagerId: createdById, // Assign to the user uploading it
        },
      });

      // Delete old document from MinIO + Postgres
      if (oldDocument) {
        try {
          await minio.removeObject(oldDocument.bucket, oldDocument.objectKey);
        } catch (err: any) {
          console.warn(
            "MinIO delete failed for old document (continuing):",
            err.message
          );
        }
        await prisma.resumeDocument.delete({ where: { id: oldDocumentId } });
      }

      isUpdate = true;
    } else {
      // Create new candidate profile
      candidate = await prisma.candidateProfile.create({
        data: {
          documentId: document.id,
          profile: profileResult.profile,
          rawText: profileResult.rawText,
          totalExperienceYears,
          organizationId,
          createdById,
          assignedManagerId: createdById, // Assign to the user uploading it
        },
      });
    }

    // 5. Build embedding and store in Qdrant
    await axios.post(`${AI_SERVICE_URL}/build-candidate-index`, {
      candidateId: candidate.id,
      profile: profileResult.profile,
      organizationId,
    });

    // 6. Mark pipeline complete
    await prisma.resumeDocument.update({
      where: { id: document.id },
      data: { status: "PARSED" },
    });

    return {
      success: true,
      fileName,
      documentId: document.id,
      candidateId: candidate.id,
      status: "PARSED",
      indexed: true,
      updated: isUpdate,
    };
  } catch (error: any) {
    if (documentId) {
      await prisma.resumeDocument
        .update({ where: { id: documentId }, data: { status: "FAILED" } })
        .catch(() => {});
    }

    console.error(
      `Resume pipeline failed for "${fileName}":`,
      error.response?.data || error.message
    );

    return {
      success: false,
      fileName,
      status: "FAILED",
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message,
    };
  }
}

/* ─────────────────────────────────────────────────────────────
   Controller: POST /resume-pipeline
   ───────────────────────────────────────────────────────────── */
export async function uploadResumes(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[] | undefined;
  const user = (req as any).user;

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one resume file is required",
    });
  }

  if (files.length > MAX_BATCH_FILES) {
    return res.status(400).json({
      success: false,
      error: `Maximum ${MAX_BATCH_FILES} files allowed per upload`,
    });
  }

  const settled = await Promise.allSettled(
    files.map((file) => processSingleResume(file, user.organizationId, user.id))
  );

  const results = settled.map((outcome) => {
    if (outcome.status === "fulfilled") return outcome.value;
    return {
      success: false,
      fileName: "unknown",
      status: "FAILED" as const,
      error: outcome.reason?.message || "Unexpected error",
    };
  });

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;
  const httpStatus = succeeded === 0 ? 500 : failed > 0 ? 207 : 201;

  return res.status(httpStatus).json({
    success: succeeded > 0,
    total: results.length,
    succeeded,
    failed,
    results,
  });
}
