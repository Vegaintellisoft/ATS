import type { Request } from "express";
import type { Role } from "@prisma/client";

/**
 * Extends Express Request with the authenticated user payload.
 * Use this instead of (req as any).user everywhere.
 */
export interface AuthRequest extends Request {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: { id: string; name: string };
    permissions: string[];
    organizationId: string | null;
    teamId: string | null;
  };
}
