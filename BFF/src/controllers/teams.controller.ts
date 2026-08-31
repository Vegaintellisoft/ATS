import type { Request, Response } from "express";
import * as teamsService from "../services/teams.service.js";
import { AuthRequest } from "../types/auth.js";

export async function createTeamHandler(req: Request, res: Response) {
  const { name, organizationId } = req.body;
  const user = (req as AuthRequest).user;

  if (!name) {
    return res.status(400).json({ success: false, error: "Name is required" });
  }

  // Determine org to create team in:
  // 1. Use explicitly provided organizationId if given
  // 2. Fall back to the user's own organizationId (works for both ADMIN and TEAM_MANAGER)
  const targetOrgId = organizationId || user.organizationId;

  if (!targetOrgId) {
    return res.status(400).json({
      success: false,
      error: "Cannot determine organization. Please provide organizationId or ensure your account is linked to an organization.",
    });
  }

  try {
    const team = await teamsService.createTeam(name, targetOrgId);
    return res.status(201).json({ success: true, data: team });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to create team" });
  }
}

export async function getTeamsHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;

  try {
    let teams;
    if (user.role.name === "ADMIN") {
      teams = await teamsService.getTeams(req.query.organizationId as string);
    } else {
      teams = await teamsService.getTeams(user.organizationId!);
    }
    return res.status(200).json({ success: true, data: teams });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
}

export async function updateTeamHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { name } = req.body;
  const user = (req as AuthRequest).user;

  if (!name) {
    return res.status(400).json({ success: false, error: "Name is required" });
  }

  try {
    const team = await teamsService.getTeamById(id as string);
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    if (user.role.name !== "ADMIN" && team.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const updated = await teamsService.updateTeam(id as string, name);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update team" });
  }
}

export async function deleteTeamHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;

  try {
    const team = await teamsService.getTeamById(id as string);
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    if (user.role.name !== "ADMIN" && team.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    await teamsService.deleteTeam(id as string);
    return res.status(200).json({ success: true, data: "Team deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to delete team" });
  }
}
