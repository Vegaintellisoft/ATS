import { request } from "./client";
import type { Role, Permission } from "../types";

const BASE = "/api/v1/roles";

export async function listRoles(organizationId?: string): Promise<Role[]> {
  const url = organizationId ? `${BASE}?organizationId=${organizationId}` : BASE;
  const data = await request<{ success: boolean; data: Role[] }>(url, "GET");
  return data.data;
}

export async function getRole(id: string): Promise<Role> {
  const data = await request<{ success: boolean; data: Role }>(`${BASE}/${id}`, "GET");
  return data.data;
}

export async function listPermissions(): Promise<Permission[]> {
  const data = await request<{ success: boolean; data: Permission[] }>(`${BASE}/permissions`, "GET");
  return data.data;
}

export async function createRole(roleData: { name: string; description?: string; permissionKeys: string[]; organizationId?: string }): Promise<Role> {
  const data = await request<{ success: boolean; data: Role }>(BASE, "POST", roleData);
  return data.data;
}

export async function updateRole(id: string, roleData: { name?: string; description?: string; permissionKeys?: string[] }): Promise<Role> {
  const data = await request<{ success: boolean; data: Role }>(`${BASE}/${id}`, "PATCH", roleData);
  return data.data;
}

export async function deleteRole(id: string): Promise<void> {
  await request(`${BASE}/${id}`, "DELETE");
}
