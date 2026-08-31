import type { Request, Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import * as dashboardService from "../services/dashboard.service.js";

/* ── GET /dashboard/summary ──────────────────────────────── */
export async function getSummaryHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  try {
    const summary = await dashboardService.getSummary(user.id, user.role.name, user.permissions, user.organizationId);
    return res.status(200).json({ success: true, data: summary });
  } catch (err: any) {
    console.error("Dashboard summary failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch dashboard summary" });
  }
}

/* ── GET /dashboard/managers ─────────────────────────────── */
export async function getManagersHandler(req: Request, res: Response) {
  try {
    const managers = await dashboardService.getManagers();
    return res.status(200).json({ success: true, data: managers });
  } catch (err: any) {
    console.error("Dashboard managers failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch managers" });
  }
}

/* ── GET /dashboard/teams ────────────────────────────────── */
export async function getTeamsHandler(req: Request, res: Response) {
  try {
    const teams = await dashboardService.getTeams();
    return res.status(200).json({ success: true, data: teams });
  } catch (err: any) {
    console.error("Dashboard teams failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
}

/* ── GET /dashboard/activity ─────────────────────────────── */
export async function getActivityHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  const limit = Number(req.query.limit) || 20;
  try {
    const activity = await dashboardService.getActivity(user.id, user.role.name, user.permissions, user.organizationId, limit);
    return res.status(200).json({ success: true, data: activity });
  } catch (err: any) {
    console.error("Dashboard activity failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch activity" });
  }
}
