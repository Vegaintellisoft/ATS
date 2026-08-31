import { request } from "./client";

const BASE = "/api/v1/organizations";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export async function listOrganizations(): Promise<Organization[]> {
  const data = await request<{ success: boolean; data: Organization[] }>(BASE, "GET");
  return data.data;
}

export async function createOrganization(name: string): Promise<Organization> {
  const data = await request<{ success: boolean; data: Organization }>(BASE, "POST", { name });
  return data.data;
}

export async function deleteOrganization(id: string): Promise<void> {
  await request(`${BASE}/${id}`, "DELETE");
}
