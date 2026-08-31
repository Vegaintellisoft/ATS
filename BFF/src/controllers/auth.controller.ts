import type { Request, Response } from "express";
import type { Role } from "@prisma/client";
import type { AuthRequest } from "../types/auth.js";
import * as authService from "../services/auth.service.js";

/* ── POST /auth/login ─────────────────────────────────────── */
export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password are required" });
  }

  try {
    const result = await authService.login(email, password);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    return res
      .status(err.httpStatus ?? 500)
      .json({ success: false, error: err.message || "Login failed" });
  }
}

/* ── POST /auth/register (dev-only) ──────────────────────── */
export async function registerHandler(req: Request, res: Response) {
  const { email, password, role, name, organizationId, teamId } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password are required" });
  }

  try {
    const result = await authService.register(
      email,
      password,
      role as string | undefined,
      name,
      organizationId,
      teamId
    );
    return res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    return res
      .status(err.httpStatus ?? 500)
      .json({ success: false, error: err.message || "Registration failed" });
  }
}

/* ── GET /auth/me ─────────────────────────────────────────── */
export async function meHandler(req: Request, res: Response) {
  const authReq = req as AuthRequest;

  try {
    const user = await authService.getMe(authReq.user.id);
    return res.status(200).json({ success: true, user });
  } catch (err: any) {
    return res
      .status(err.httpStatus ?? 500)
      .json({ success: false, error: err.message || "Failed to fetch user" });
  }
}
