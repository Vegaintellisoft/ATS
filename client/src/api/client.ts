import type {
  BatchUploadResponse,
  UploadErrorResponse,
  SearchResponse,
  SearchErrorResponse,
  LoginResponse,
  MeResponse,
} from "../types";

const BASE = "/api/v1";

// ─── Token helpers ───────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem("ats_token");
}

export function setToken(token: string): void {
  localStorage.setItem("ats_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("ats_token");
}

// ─── Core fetch wrapper ──────────────────────────────────────

type FetchMethod = "GET" | "POST" | "DELETE" | "PATCH";

export async function request<T>(
  url: string,
  method: FetchMethod,
  body?: unknown,
  isMultipart = false
): Promise<T> {
  const headers: Record<string, string> = {};

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (body && !isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: isMultipart
      ? (body as FormData)
      : body
      ? JSON.stringify(body)
      : undefined,
  });

  // On 401, clear the stored token so AuthContext can redirect to login
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("ats:unauthorized"));
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

// ─── Auth endpoints ──────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<LoginResponse>(`${BASE}/auth/login`, "POST", { email, password }),

  register: (email: string, password: string, role?: string) =>
    request<LoginResponse>(`${BASE}/auth/register`, "POST", { email, password, role }),

  me: () => request<MeResponse>(`${BASE}/auth/me`, "GET"),
};

// ─── Resume pipeline ─────────────────────────────────────────

/**
 * Upload 1–10 resume files through the batch pipeline.
 * POST /api/v1/resume-pipeline  (multipart/form-data, field: "files")
 */
export async function uploadResumes(files: File[]): Promise<BatchUploadResponse> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  const data = await request<BatchUploadResponse | UploadErrorResponse>(
    `${BASE}/resume-pipeline`,
    "POST",
    form,
    true
  );

  if (!data.success) {
    throw new Error((data as UploadErrorResponse).error || "Resume upload failed");
  }

  return data as BatchUploadResponse;
}

// ─── Search ──────────────────────────────────────────────────

/**
 * Search candidates by job description.
 * POST /api/v1/search-candidates
 */
export async function searchCandidates(
  jobDescription: string,
  limit: number = 10,
  minExperience?: number,
  maxExperience?: number
): Promise<SearchResponse> {
  const data = await request<SearchResponse | SearchErrorResponse>(
    `${BASE}/search-candidates`,
    "POST",
    { jobDescription, limit, minExperience, maxExperience }
  );

  if (!data.success) {
    throw new Error((data as SearchErrorResponse).error || "Candidate search failed");
  }

  return data as SearchResponse;
}

/**
 * Search candidates by uploading a resume PDF.
 * POST /api/v1/search-by-resume  (multipart/form-data, field: "file")
 */
export async function searchByResume(
  file: File,
  limit: number = 10,
  minExperience?: number,
  maxExperience?: number
): Promise<SearchResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("limit", String(limit));
  if (minExperience !== undefined) form.append("minExperience", String(minExperience));
  if (maxExperience !== undefined) form.append("maxExperience", String(maxExperience));

  const data = await request<SearchResponse | SearchErrorResponse>(
    `${BASE}/search-by-resume`,
    "POST",
    form,
    true
  );

  if (!data.success) {
    throw new Error((data as SearchErrorResponse).error || "Resume search failed");
  }

  return data as SearchResponse;
}

// ─── Candidates ──────────────────────────────────────────────

/**
 * List all parsed candidate profiles.
 * GET /api/v1/candidates
 */
export async function listCandidates(): Promise<import("../types").ListResponse> {
  const data = await request<import("../types").ListResponse>(
    `${BASE}/candidates`,
    "GET"
  );

  if (!data.success) {
    throw new Error("Failed to list candidates");
  }

  return data;
}

/**
 * Delete a candidate by ID.
 * DELETE /api/v1/candidates/:id
 */
export async function deleteCandidateById(
  id: string
): Promise<{ success: boolean; deletedId: string }> {
  return request(`${BASE}/candidates/${id}`, "DELETE");
}

/**
 * Assign a candidate to a manager.
 * PATCH /api/v1/candidates/:id/assign
 */
export async function assignCandidate(
  id: string,
  managerId: string
): Promise<{ success: boolean; data: any }> {
  return request(`${BASE}/candidates/${id}/assign`, "PATCH", { managerId });
}

/**
 * Update a candidate's status.
 * PATCH /api/v1/candidates/:id/status
 */
export async function updateCandidateStatus(
  id: string,
  status: string
): Promise<{ success: boolean; data: any }> {
  return request(`${BASE}/candidates/${id}/status`, "PATCH", { status });
}
