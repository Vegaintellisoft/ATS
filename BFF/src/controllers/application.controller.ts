import { Request, Response } from "express";
import * as applicationService from "../services/application.service.js";
import { AuthRequest } from "../types/auth.js";
import { ApplicationStatus } from "@prisma/client";

export async function createApplicationHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  const { candidateId, requirementId, matchScore } = req.body;

  if (!user.organizationId) {
    return res.status(403).json({ success: false, error: "No organization associated" });
  }

  if (!candidateId || !requirementId) {
    return res.status(400).json({ success: false, error: "Missing candidateId or requirementId" });
  }

  try {
    const app = await applicationService.createApplication({
      candidateId,
      requirementId,
      organizationId: user.organizationId,
      createdById: user.id,
      matchScore
    });

    return res.status(201).json({ success: true, data: app });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function updateApplicationStatusHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!user.organizationId) {
    return res.status(403).json({ success: false, error: "No organization associated" });
  }

  if (!status) {
    return res.status(400).json({ success: false, error: "Missing status" });
  }

  try {
    const app = await applicationService.updateApplicationStatus({
      applicationId: id as string,
      newStatus: status as ApplicationStatus,
      changedById: user.id,
      organizationId: user.organizationId,
      remarks
    });

    return res.status(200).json({ success: true, data: app });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function getRequirementApplicationsHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  const { requirementId } = req.params;

  if (!user.organizationId) {
    return res.status(403).json({ success: false, error: "No organization associated" });
  }

  try {
    const apps = await applicationService.getApplicationsForRequirement(requirementId as string, user.organizationId);
    return res.status(200).json({ success: true, data: apps });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch applications" });
  }
}

export async function getApplicationHistoryHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  const { id } = req.params;

  if (!user.organizationId) {
    return res.status(403).json({ success: false, error: "No organization associated" });
  }

  try {
    const history = await applicationService.getApplicationPipelineHistory(id as string, user.organizationId);
    return res.status(200).json({ success: true, data: history });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

export async function getAllApplicationsHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;

  if (!user.organizationId) {
    return res.status(403).json({ success: false, error: "No organization associated" });
  }

  try {
    const apps = await applicationService.getAllApplications(user.organizationId);
    return res.status(200).json({ success: true, data: apps });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch applications" });
  }
}
