import { Request, Response } from "express";
import crypto from "crypto";

import { prisma } from "../config/prisma.js";
import { AISearchProvider } from "../providers/ai-search.provider.js";
import { CandidateProfileRepository } from "../repositories/candidate-profile.repository.js";
import { RankingEngine } from "../ranking/ranking-engine.js";
import { minio } from "../config/minio.js";
import axios from "axios";

const aiSearchProvider = new AISearchProvider();
const candidateProfileRepository = new CandidateProfileRepository();
const rankingEngine = new RankingEngine();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const bucket = process.env.MINIO_BUCKET || "ats-resumes";

/* ── POST /candidates ───────────────────────────────────── */
export async function uploadCandidate(req: Request, res: Response) {
  const file = req.file;
  const user = (req as any).user;

  if (!file) {
    return res.status(400).json({ success: false, error: "A resume file is required" });
  }

  const fileName = file.originalname;
  const ext = fileName.substring(fileName.lastIndexOf("."));
  const objectKey = `resumes/${crypto.randomUUID()}${ext}`;
  let documentId: string | null = null;

  try {
    // 1. Upload to MinIO
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
    const profileResponse = await axios.post(`${AI_SERVICE_URL}/parse-resume`, { objectKey });
    const profileResult = profileResponse.data as { success: boolean; profile: any; rawText: string };

    const totalExperienceYears: number | null =
      profileResult.profile?.computed?.totalExperienceYears ?? null;

    // 4. Duplicate detection by name + email
    const candidateName = profileResult.profile?.candidate?.name?.trim() || null;
    const candidateEmail = profileResult.profile?.candidate?.email?.trim() || null;
    let existingCandidate = null;

    if (candidateName) {
      const matches = await prisma.candidateProfile.findMany({
        where: { profile: { path: ["candidate", "name"], equals: candidateName } },
      });
      if (matches.length > 0 && candidateEmail) {
        existingCandidate =
          matches.find((m: any) => (m.profile as any)?.candidate?.email?.trim() === candidateEmail) ||
          matches[0];
      } else if (matches.length > 0) {
        existingCandidate = matches[0];
      }
    }

    let candidate;
    let isUpdate = false;

    if (existingCandidate) {
      const oldDocument = await prisma.resumeDocument.findUnique({ where: { id: existingCandidate.documentId } });
      candidate = await prisma.candidateProfile.update({
        where: { id: existingCandidate.id },
        data: {
          documentId: document.id,
          profile: profileResult.profile,
          rawText: profileResult.rawText,
          version: { increment: 1 },
          totalExperienceYears,
          assignedManagerId: user.id,
        },
      });
      if (oldDocument) {
        try { await minio.removeObject(oldDocument.bucket, oldDocument.objectKey); } catch {}
        await prisma.resumeDocument.delete({ where: { id: existingCandidate.documentId } });
      }
      isUpdate = true;
    } else {
      candidate = await prisma.candidateProfile.create({
        data: {
          documentId: document.id,
          profile: profileResult.profile,
          rawText: profileResult.rawText,
          totalExperienceYears,
          organizationId: user.organizationId || null,
          createdById: user.id,
          assignedManagerId: user.id,
        },
      });
    }

    // 5. Build embedding in Qdrant
    await axios.post(`${AI_SERVICE_URL}/build-candidate-index`, {
      candidateId: candidate.id,
      profile: profileResult.profile,
      organizationId: user.organizationId || null,
    });

    // 6. Mark document as PARSED
    await prisma.resumeDocument.update({ where: { id: document.id }, data: { status: "PARSED" } });

    return res.status(201).json({
      success: true,
      updated: isUpdate,
      candidateId: candidate.id,
      documentId: document.id,
    });
  } catch (error: any) {
    if (documentId) {
      await prisma.resumeDocument
        .update({ where: { id: documentId }, data: { status: "FAILED" } })
        .catch(() => {});
    }
    console.error("Upload candidate failed:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.detail || error.response?.data?.error || error.message,
    });
  }
}

/* ── GET /candidates ─────────────────────────────────────── */
export async function listCandidates(req: Request, res: Response) {
  const user = (req as any).user;
  try {
    let whereClause: any = {};
    if (user.organizationId) {
      if (!user.permissions.includes("candidate:view")) {
        // Fallback constraint if they only have limited view, though the route guard requires candidate:view
        // We'll use team-based visibility if they lack full org view (e.g., RECRUITER vs RECRUITMENT_MANAGER)
        // For now, if they have candidate:view, they see org candidates, but let's restrict if they don't have user:view
        if (!user.permissions.includes("user:view") && user.teamId) {
          const teamUsers = await prisma.user.findMany({ where: { teamId: user.teamId }, select: { id: true } });
          const teamUserIds = teamUsers.map((u: any) => u.id);
          whereClause = {
            OR: [
              { assignedManagerId: { in: teamUserIds } },
              { createdById: { in: teamUserIds } }
            ]
          };
        } else if (!user.permissions.includes("user:view")) {
          whereClause = {
            OR: [
              { assignedManagerId: user.id },
              { createdById: user.id }
            ]
          };
        }
      }
      whereClause.organizationId = user.organizationId;
    }

    const candidates = await prisma.candidateProfile.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            originalName: true,
            status: true,
            createdAt: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: candidates.length,
      candidates: candidates.map((c: any) => ({
        id: c.id,
        documentId: c.documentId,
        profile: c.profile,
        version: c.version,
        totalExperienceYears: c.totalExperienceYears,
        status: c.status,
        assignedManagerId: c.assignedManagerId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        document: {
          originalName: c.document.originalName,
          status: c.document.status,
          uploadedAt: c.document.createdAt,
        },
        createdBy: c.createdBy
          ? { id: c.createdBy.id, name: c.createdBy.name, email: c.createdBy.email }
          : null,
      })),
    });
  } catch (error: any) {
    console.error("List candidates failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to retrieve candidates" });
  }
}

/* ── GET /candidates/:id ─────────────────────────────────── */
export async function getCandidate(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: id as string },
      include: {
        document: {
          select: { originalName: true, status: true, createdAt: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (user.organizationId && candidate.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    return res.status(200).json({ success: true, data: candidate });
  } catch (error: any) {
    console.error("Get candidate failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to get candidate" });
  }
}

/* ── PATCH /candidates/:id ───────────────────────────────── */
export async function updateCandidate(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: id as string },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (user.organizationId && candidate.organizationId && candidate.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden: Candidate belongs to another organization" });
    }

    const allowedFields = ["status", "assignedManagerId", "totalExperienceYears", "profile"];
    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    const updated = await prisma.candidateProfile.update({
      where: { id: id as string },
      data,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update candidate failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to update candidate" });
  }
}

/* ── POST /search-candidates ─────────────────────────────── */
export async function searchCandidates(req: Request, res: Response) {
  try {
    const { jobDescription, limit = 10, minExperience, maxExperience } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ success: false, error: "jobDescription is required" });
    }

    const user = (req as any).user;
    const [semanticCandidates, parsedQuery] = await Promise.all([
      aiSearchProvider.semanticSearch(jobDescription, limit, minExperience, maxExperience, user.organizationId || null),
      aiSearchProvider.parseJobDescription(jobDescription),
    ]);

    if (semanticCandidates.length === 0) {
      return res.status(200).json({ success: true, count: 0, candidates: [] });
    }

    const profiles = await candidateProfileRepository.getProfiles(semanticCandidates);
    const rankedCandidates = rankingEngine.rank(semanticCandidates, profiles, parsedQuery);

    return res.status(200).json({ success: true, count: rankedCandidates.length, candidates: rankedCandidates });
  } catch (error: any) {
    console.error("Candidate search failed:", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: "Candidate search failed" });
  }
}

/* ── POST /search-by-resume ──────────────────────────────── */
import FormData from "form-data";

export async function searchByResume(req: Request, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: "A PDF file is required" });
    }

    const limit = Number(req.body.limit) || 10;
    const minExperience = req.body.minExperience ? Number(req.body.minExperience) : undefined;
    const maxExperience = req.body.maxExperience ? Number(req.body.maxExperience) : undefined;

    const form = new FormData();
    form.append("file", file.buffer, { filename: file.originalname, contentType: file.mimetype });
    form.append("limit", String(limit));
    if (minExperience !== undefined) form.append("minExperience", String(minExperience));
    if (maxExperience !== undefined) form.append("maxExperience", String(maxExperience));

    const user = (req as any).user;
    if (user.organizationId) {
      form.append("organizationId", user.organizationId);
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/search-by-resume`, form, {
      headers: form.getHeaders(),
    });

    const semanticCandidates = aiResponse.data.candidates || [];

    if (semanticCandidates.length === 0) {
      return res.status(200).json({ success: true, count: 0, candidates: [] });
    }

    const profiles = await candidateProfileRepository.getProfiles(semanticCandidates);
    const parsedQuery = { jobTitle: null, domain: null, requiredSkills: [] as string[], preferredSkills: [] as string[], raw: "" };
    const rankedCandidates = rankingEngine.rank(semanticCandidates, profiles, parsedQuery);

    return res.status(200).json({ success: true, count: rankedCandidates.length, candidates: rankedCandidates });
  } catch (error: any) {
    console.error("Resume search failed:", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: "Resume search failed" });
  }
}

/* ── DELETE /candidates/:id ──────────────────────────────── */
export async function deleteCandidate(req: Request, res: Response) {
  const id = (req.params.id as string) as string;

  const user = (req as any).user;

  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: { document: true },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (user.organizationId) {
      if (candidate.organizationId && candidate.organizationId !== user.organizationId) {
        return res.status(403).json({ success: false, error: "Forbidden: Candidate belongs to another organization" });
      }
      let isSameTeam = false;
      if (user.teamId) {
        if (candidate.createdById) {
          const creator = await prisma.user.findUnique({ where: { id: candidate.createdById } });
          if (creator?.teamId === user.teamId) isSameTeam = true;
        }
        if (candidate.assignedManagerId) {
          const manager = await prisma.user.findUnique({ where: { id: candidate.assignedManagerId } });
          if (manager?.teamId === user.teamId) isSameTeam = true;
        }
      }
      
      if (candidate.createdById !== user.id && candidate.assignedManagerId !== user.id && !isSameTeam && !user.permissions.includes("user:view")) {
        return res.status(403).json({ success: false, error: "Forbidden: You do not own this candidate" });
      }
    }

    const externalTasks: Promise<any>[] = [];
    externalTasks.push(axios.delete(`${AI_SERVICE_URL}/delete-candidate-index/${id}`));

    if (candidate.document) {
      externalTasks.push(minio.removeObject(candidate.document.bucket, candidate.document.objectKey));
    }

    await Promise.all(externalTasks);

    await prisma.$transaction([
      prisma.candidateProfile.delete({ where: { id } }),
      prisma.resumeDocument.delete({ where: { id: candidate.documentId } }),
    ]);

    return res.status(200).json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("Delete candidate failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to delete candidate" });
  }
}

/* ── GET /candidates/:id/resume ──────────────────────────── */
export async function downloadResume(req: Request, res: Response) {
  const rawId = ((req.params.id as string) as string);
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    return res.status(400).json({ error: "Invalid resume id" });
  }

  const user = (req as any).user;

  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: { document: true },
    });

    if (!candidate || !candidate.document) {
      return res.status(404).json({ error: "Resume not found" });
    }

    if (user.organizationId) {
      if (candidate.organizationId && candidate.organizationId !== user.organizationId) {
        return res.status(403).json({ error: "Forbidden: Candidate belongs to another organization" });
      }
      let isSameTeam = false;
      if (user.teamId) {
        if (candidate.createdById) {
          const creator = await prisma.user.findUnique({ where: { id: candidate.createdById } });
          if (creator?.teamId === user.teamId) isSameTeam = true;
        }
        if (candidate.assignedManagerId) {
          const manager = await prisma.user.findUnique({ where: { id: candidate.assignedManagerId } });
          if (manager?.teamId === user.teamId) isSameTeam = true;
        }
      }
      
      if (candidate.createdById !== user.id && candidate.assignedManagerId !== user.id && !isSameTeam && !user.permissions.includes("user:view")) {
        return res.status(403).json({ error: "Forbidden: You do not own this candidate" });
      }
    }

    const { bucket, objectKey, originalName, mimeType } = candidate.document;
    const stream = await minio.getObject(bucket, objectKey);

    const isDownload = (req.query.download as string) === "true";
    const disposition = isDownload ? "attachment" : "inline";

    res.setHeader("Content-Disposition", `${disposition}; filename="${originalName}"`);
    res.setHeader("Content-Type", mimeType);

    stream.pipe(res);
  } catch (error: any) {
    console.error("Failed to download resume:", error.message);
    res.status(500).json({ error: "Failed to download resume" });
  }
}

/* ── PATCH /candidates/:id/assign ────────────────────────── */
export async function assignCandidate(req: Request, res: Response) {
  const { id } = req.params;
  const { managerId } = req.body;
  const user = (req as any).user;

  if (!managerId) {
    return res.status(400).json({ success: false, error: "managerId is required" });
  }

  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: id as string },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (user.organizationId) {
      if (candidate.organizationId && candidate.organizationId !== user.organizationId) {
        return res.status(403).json({ success: false, error: "Forbidden: Candidate belongs to another organization" });
      }
      let isSameTeam = false;
      if (user.teamId) {
        if (candidate.createdById) {
          const creator = await prisma.user.findUnique({ where: { id: candidate.createdById } });
          if (creator?.teamId === user.teamId) isSameTeam = true;
        }
        if (candidate.assignedManagerId) {
          const manager = await prisma.user.findUnique({ where: { id: candidate.assignedManagerId } });
          if (manager?.teamId === user.teamId) isSameTeam = true;
        }
      }
      
      if (candidate.createdById !== user.id && candidate.assignedManagerId !== user.id && !isSameTeam && !user.permissions.includes("user:view")) {
        return res.status(403).json({ success: false, error: "Forbidden: You do not own this candidate" });
      }
    }

    const manager = await prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      return res.status(404).json({ success: false, error: "Manager not found" });
    }

    if (user.organizationId && manager.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden: Manager belongs to another organization" });
    }

    const updated = await prisma.candidateProfile.update({
      where: { id: id as string },
      data: { assignedManagerId: managerId },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Assign candidate failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to assign candidate" });
  }
}

/* ── PATCH /candidates/:id/status ────────────────────────── */
const VALID_STATUSES = ["NEW", "SCREENING", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED", "HIRED"];

export async function updateCandidateStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  const user = (req as any).user;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: id as string },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (user.organizationId) {
      if (candidate.organizationId && candidate.organizationId !== user.organizationId) {
        return res.status(403).json({ success: false, error: "Forbidden: Candidate belongs to another organization" });
      }
      let isSameTeam = false;
      if (user.teamId) {
        if (candidate.createdById) {
          const creator = await prisma.user.findUnique({ where: { id: candidate.createdById } });
          if (creator?.teamId === user.teamId) isSameTeam = true;
        }
        if (candidate.assignedManagerId) {
          const manager = await prisma.user.findUnique({ where: { id: candidate.assignedManagerId } });
          if (manager?.teamId === user.teamId) isSameTeam = true;
        }
      }
      
      if (candidate.createdById !== user.id && candidate.assignedManagerId !== user.id && !isSameTeam && !user.permissions.includes("user:view")) {
        return res.status(403).json({ success: false, error: "Forbidden: You do not own this candidate" });
      }
    }

    const updated = await prisma.candidateProfile.update({
      where: { id: id as string },
      data: { status: status as any },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update candidate status failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to update candidate status" });
  }
}

/* ── GET /candidates/:id/detail ─────────────────────────── */
export async function getCandidateDetail(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        documentId: true,
        profile: true,
        totalExperienceYears: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        document: {
          select: { originalName: true, status: true, createdAt: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedManager: {
          select: { id: true, name: true, email: true },
        },
        applications: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
            matchScore: true,
            createdAt: true,
            requirement: {
              select: {
                id: true,
                title: true,
                status: true,
                minExperience: true,
                maxExperience: true,
                location: true,
                account: {
                  select: { id: true, displayName: true },
                },
              },
            },
            assignedRecruiter: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (user.organizationId && candidate.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    return res.status(200).json({ success: true, data: candidate });
  } catch (error: any) {
    console.error("Get candidate detail failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to get candidate detail" });
  }
}

/* ── GET /candidates/:id/activity ───────────────────────── */
export async function getCandidateActivity(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    // Verify the candidate exists and belongs to the org
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: id as string },
      select: { organizationId: true },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    if (user.organizationId && candidate.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // Fetch activity logs for this candidate entity
    const logs = await prisma.activityLog.findMany({
      where: {
        organizationId: candidate.organizationId,
        OR: [
          { entityType: "Candidate", entityId: id as string },
          // Also show pipeline movements for this candidate's applications
          {
            entityType: "Application",
            entityId: {
              in: (await prisma.application.findMany({
                where: { candidateId: id as string },
                select: { id: true },
              })).map((a: any) => a.id),
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        performedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    console.error("Get candidate activity failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to get candidate activity" });
  }
}
