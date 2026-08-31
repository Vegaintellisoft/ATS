import { request } from "./client";

const BASE = "/api/v1/candidates";

export async function getCandidateDetail(id: string) {
  const res = await request<{ success: boolean; data: any }>(`${BASE}/${id}/detail`, "GET");
  return res.data;
}

export async function getCandidateActivity(id: string) {
  const res = await request<{ success: boolean; data: any[] }>(`${BASE}/${id}/activity`, "GET");
  return res.data;
}
