import { request } from "./client";

const BASE = "/api/v1/teams";

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
}

export async function listTeams(): Promise<Team[]> {
  const data = await request<{ success: boolean; data: Team[] }>(BASE, "GET");
  return data.data;
}

export async function createTeam(name: string, organizationId?: string): Promise<Team> {
  const body: any = { name };
  if (organizationId) body.organizationId = organizationId;
  const data = await request<{ success: boolean; data: Team }>(BASE, "POST", body);
  return data.data;
}

export async function deleteTeam(id: string): Promise<void> {
  await request(`${BASE}/${id}`, "DELETE");
}
