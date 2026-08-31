import { request } from "./client";

const BASE = "/api/v1/reports";

export async function getAccountReport() {
  const res = await request<{ success: boolean; data: any[] }>(`${BASE}/account`, "GET");
  return res.data;
}

export async function getRequirementReport() {
  const res = await request<{ success: boolean; data: any[] }>(`${BASE}/requirement`, "GET");
  return res.data;
}

export async function getRecruiterReport() {
  const res = await request<{ success: boolean; data: any[] }>(`${BASE}/recruiter`, "GET");
  return res.data;
}

export async function getManagerReport() {
  const res = await request<{ success: boolean; data: any[] }>(`${BASE}/manager`, "GET");
  return res.data;
}

export async function downloadReport(reportType: "account" | "requirement" | "recruiter" | "manager") {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE}/${reportType}?export=csv`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to download report");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportType}_report.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
