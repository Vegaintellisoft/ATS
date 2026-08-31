import { request } from "./client";
import { type User } from "../types";

const BASE = "/api/v1/users";

export async function listUsers(organizationId?: string): Promise<User[]> {
  const url = organizationId ? `${BASE}?organizationId=${organizationId}` : BASE;
  const data = await request<{ success: boolean; data: User[] }>(url, "GET");
  return data.data;
}

export async function inviteUser(
  email: string,
  role: string,
  name?: string,
  organizationId?: string,
  teamId?: string,
  password?: string
): Promise<User> {
  const body: any = { email, role };
  if (name) body.name = name;
  if (organizationId) body.organizationId = organizationId;
  if (teamId) body.teamId = teamId;
  if (password) body.password = password;

  const data = await request<{ success: boolean; data: User }>(`${BASE}/invite`, "POST", body);
  return data.data;
}

export async function updateUserRole(id: string, role: string): Promise<User> {
  const data = await request<{ success: boolean; data: User }>(`${BASE}/${id}/role`, "PATCH", { role });
  return data.data;
}

export async function updateUserTeam(id: string, teamId: string | null): Promise<User> {
  const data = await request<{ success: boolean; data: User }>(`${BASE}/${id}/team`, "PATCH", { teamId });
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await request(`${BASE}/${id}`, "DELETE");
}

export async function createUser(data: {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  role: string;
  employeeCode?: string;
  contactNumber?: string;
  department?: string;
  reportingPersonId?: string;
}): Promise<User> {
  const body: any = {
    email: data.email,
    role: data.role,
  };
  if (data.password) body.password = data.password;
  if (data.name) body.name = data.name;
  if (data.phone) body.phone = data.phone;
  if (data.employeeCode) body.employeeCode = data.employeeCode;
  if (data.contactNumber) body.contactNumber = data.contactNumber;
  if (data.department) body.department = data.department;
  if (data.reportingPersonId) body.reportingPersonId = data.reportingPersonId;

  const res = await request<{ success: boolean; data: User }>(`${BASE}/invite`, "POST", body);
  return res.data;
}

export interface UpdateUserPayload extends Omit<Partial<User>, "role"> {
  role?: string;
}

export async function updateUser(id: string, data: UpdateUserPayload): Promise<User> {
  const res = await request<{ success: boolean; data: User }>(`${BASE}/${id}`, "PATCH", data);
  return res.data;
}

export async function getHierarchy(id: string): Promise<User[]> {
  const data = await request<{ success: boolean; data: User[] }>(`${BASE}/${id}/hierarchy`, "GET");
  return data.data;
}

export async function getSubordinates(id: string): Promise<User[]> {
  const data = await request<{ success: boolean; data: User[] }>(`${BASE}/${id}/subordinates`, "GET");
  return data.data;
}
