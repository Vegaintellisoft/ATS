import { request } from "./client";
import type { DashboardSummary, ManagerStats, TeamStats, ActivityItem } from "../types";

const BASE = "/api/v1/dashboard";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const data = await request<{ success: boolean; data: DashboardSummary }>(BASE + "/summary", "GET");
  return data.data;
}

export async function getDashboardManagers(): Promise<ManagerStats[]> {
  const data = await request<{ success: boolean; data: ManagerStats[] }>(BASE + "/managers", "GET");
  return data.data;
}

export async function getDashboardTeams(): Promise<TeamStats[]> {
  const data = await request<{ success: boolean; data: TeamStats[] }>(BASE + "/teams", "GET");
  return data.data;
}

export async function getDashboardActivity(limit = 20): Promise<ActivityItem[]> {
  const data = await request<{ success: boolean; data: ActivityItem[] }>(`${BASE}/activity?limit=${limit}`, "GET");
  return data.data;
}
