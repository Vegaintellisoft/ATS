import { request } from "./client";

const BASE = "/api/v1/applications";

export interface Application {
  id: string;
  applicationCode: string;
  candidateId: string;
  requirementId: string;
  status: string; // NEW, SCREENING, SHORTLISTED, etc.
  matchScore: number | null;
  assignedRecruiterId: string | null;
  remarks: string | null;
  createdAt: string;
  candidate?: any;
  requirement?: any;
}

export async function createApplication(candidateId: string, requirementId: string, matchScore?: number): Promise<Application> {
  const res = await request<{ success: boolean; data: Application }>(BASE, "POST", { candidateId, requirementId, matchScore });
  return res.data;
}

export async function updateApplicationStatus(id: string, status: string, remarks?: string): Promise<Application> {
  const res = await request<{ success: boolean; data: Application }>(`${BASE}/${id}/status`, "PATCH", { status, remarks });
  return res.data;
}

export async function getRequirementApplications(requirementId: string): Promise<Application[]> {
  const res = await request<{ success: boolean; data: Application[] }>(`${BASE}/requirement/${requirementId}`, "GET");
  return res.data;
}

export async function getApplicationHistory(id: string): Promise<any[]> {
  const res = await request<{ success: boolean; data: any[] }>(`${BASE}/${id}/history`, "GET");
  return res.data;
}

export async function getAllApplications(): Promise<any[]> {
  const res = await request<{ success: boolean; data: any[] }>(BASE, "GET");
  return res.data;
}
