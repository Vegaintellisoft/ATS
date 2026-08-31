import { request } from "./client";
import { type Requirement } from "../types";

const BASE = "/api/v1/requirements";

export async function listRequirements(): Promise<Requirement[]> {
  const data = await request<{ success: boolean; data: Requirement[] }>(BASE, "GET");
  return data.data;
}

export async function getRequirement(id: string): Promise<Requirement> {
  const data = await request<{ success: boolean; data: Requirement }>(`${BASE}/${id}`, "GET");
  return data.data;
}

export async function createRequirement(data: Partial<Requirement>): Promise<Requirement> {
  const res = await request<{ success: boolean; data: Requirement }>(BASE, "POST", data);
  return res.data;
}

export async function updateRequirement(id: string, data: Partial<Requirement>): Promise<Requirement> {
  const res = await request<{ success: boolean; data: Requirement }>(`${BASE}/${id}`, "PATCH", data);
  return res.data;
}

export async function deleteRequirement(id: string): Promise<void> {
  await request(`${BASE}/${id}`, "DELETE");
}

export async function getRequirementHistory(id: string): Promise<any[]> {
  const data = await request<{ success: boolean; data: any[] }>(`${BASE}/${id}/history`, "GET");
  return data.data;
}

export async function matchRequirement(id: string, limit: number = 10, minScore?: number): Promise<any[]> {
  const res = await request<{ success: boolean; candidates: any[] }>(`${BASE}/${id}/match`, "POST", { limit, minScore });
  return res.candidates;
}
