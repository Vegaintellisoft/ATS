import type { Request, Response } from "express";
import * as requirementService from "../services/requirement.service.js";
import { AuthRequest } from "../types/auth.js";
import { AISearchProvider } from "../providers/ai-search.provider.js";
import { CandidateProfileRepository } from "../repositories/candidate-profile.repository.js";
import { RankingEngine } from "../ranking/ranking-engine.js";

const aiSearchProvider = new AISearchProvider();
const candidateProfileRepository = new CandidateProfileRepository();
const rankingEngine = new RankingEngine();

export async function getRequirementsHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  try {
    if (!user.organizationId) {
      return res.status(403).json({ success: false, error: "User is not part of an organization" });
    }
    const requirements = await requirementService.getRequirements(user.organizationId);
    return res.status(200).json({ success: true, data: requirements });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch requirements" });
  }
}

export async function getRequirementByIdHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;
  try {
    const requirement = await requirementService.getRequirementById(id as string);
    if (!requirement) return res.status(404).json({ success: false, error: "Requirement not found" });

    if (user.role.name !== "ADMIN" && requirement.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    return res.status(200).json({ success: true, data: requirement });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch requirement" });
  }
}

export async function createRequirementHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  const data = req.body;

  if (!user.organizationId) {
    return res.status(403).json({ success: false, error: "User is not part of an organization" });
  }

  if (!data.title || !data.accountId || !data.jobDescription) {
    return res.status(400).json({ success: false, error: "Title, account ID, and job description are required" });
  }

  try {
    const requirement = await requirementService.createRequirement({
      ...data,
      organizationId: user.organizationId,
      createdById: user.id,
    });
    return res.status(201).json({ success: true, data: requirement });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to create requirement" });
  }
}

export async function updateRequirementHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;
  const data = req.body;

  try {
    const requirement = await requirementService.getRequirementById(id as string);
    if (!requirement) return res.status(404).json({ success: false, error: "Requirement not found" });

    if (user.role.name !== "ADMIN" && requirement.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const updated = await requirementService.updateRequirement(id as string, { ...data, changedById: user.id });
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update requirement" });
  }
}

export async function getRequirementHistoryHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;

  try {
    const requirement = await requirementService.getRequirementById(id as string);
    if (!requirement) return res.status(404).json({ success: false, error: "Requirement not found" });

    if (user.role.name !== "ADMIN" && requirement.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const history = await requirementService.getRequirementHistory(id as string);
    return res.status(200).json({ success: true, data: history });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch requirement history" });
  }
}

export async function deleteRequirementHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;

  try {
    const requirement = await requirementService.getRequirementById(id as string);
    if (!requirement) return res.status(404).json({ success: false, error: "Requirement not found" });

    if (user.role.name !== "ADMIN" && requirement.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    await requirementService.deleteRequirement(id as string);
    return res.status(200).json({ success: true, data: "Requirement deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to delete requirement" });
  }
}

export async function matchCandidatesHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;
  const { limit = 10, minScore } = req.body;

  try {
    const requirement = await requirementService.getRequirementById(id as string);
    if (!requirement) return res.status(404).json({ success: false, error: "Requirement not found" });

    if (user.role.name !== "ADMIN" && requirement.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (!requirement.jobDescription) {
      return res.status(400).json({ success: false, error: "Requirement has no job description" });
    }

    const [semanticCandidates, parsedQuery] = await Promise.all([
      aiSearchProvider.semanticSearch(
        requirement.jobDescription, 
        limit, 
        requirement.minExperience || undefined, 
        requirement.maxExperience || undefined, 
        user.role.name === "ADMIN" ? null : user.organizationId
      ),
      aiSearchProvider.parseJobDescription(requirement.jobDescription),
    ]);

    if (semanticCandidates.length === 0) {
      return res.status(200).json({ success: true, count: 0, candidates: [] });
    }

    const profiles = await candidateProfileRepository.getProfiles(semanticCandidates);
    let rankedCandidates = rankingEngine.rank(semanticCandidates, profiles, parsedQuery);

    if (minScore !== undefined) {
      rankedCandidates = rankedCandidates.filter(c => c.finalScore >= minScore);
    }

    return res.status(200).json({ success: true, count: rankedCandidates.length, candidates: rankedCandidates });
  } catch (err: any) {
    console.error("Match candidates failed:", err);
    return res.status(500).json({ success: false, error: "Failed to match candidates" });
  }
}
