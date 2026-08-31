import { request } from "./client";
import { type Account } from "../types";

const BASE = "/api/v1/accounts";

export async function listAccounts(): Promise<Account[]> {
  const data = await request<{ success: boolean; data: Account[] }>(BASE, "GET");
  return data.data;
}

export async function getAccount(id: string): Promise<Account> {
  const data = await request<{ success: boolean; data: Account }>(`${BASE}/${id}`, "GET");
  return data.data;
}

export async function createAccount(data: Partial<Account>): Promise<Account> {
  const res = await request<{ success: boolean; data: Account }>(BASE, "POST", data);
  return res.data;
}

export async function updateAccount(id: string, data: Partial<Account>): Promise<Account> {
  const res = await request<{ success: boolean; data: Account }>(`${BASE}/${id}`, "PATCH", data);
  return res.data;
}

export async function deleteAccount(id: string): Promise<void> {
  await request(`${BASE}/${id}`, "DELETE");
}
