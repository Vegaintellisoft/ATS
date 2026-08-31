import type { Response, NextFunction, RequestHandler } from "express";
import type { AuthRequest } from "../types/auth.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * authenticate — verifies the Bearer JWT in the Authorization header.
 * Attaches req.user = { id, email, role } on success.
 * Returns 401 Unauthorized on missing / invalid / expired token.
 */
export const authenticate: RequestHandler = (
  req,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    
    // Force re-login for old tokens that didn't have role as an object
    if (typeof payload.role !== "object" || payload.role === null) {
      res.status(401).json({ success: false, error: "Outdated token, please log in again" });
      return;
    }

    (req as AuthRequest).user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      organizationId: payload.organizationId,
      teamId: payload.teamId,
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
};

/**
 * requirePermission(...keys) — variadic permission-check middleware.
 * Must be used AFTER authenticate.
 * Returns 403 Forbidden if the user does not have at least one of the given permission keys.
 *
 * Usage:
 *   router.delete("/candidates/:id", authenticate, requirePermission("candidate:delete"), handler);
 *   router.get("/users", authenticate, requirePermission("user:view"), handler);
 */
export const requirePermission =
  (...keys: string[]): RequestHandler =>
  (req, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    if (!user.permissions || !keys.some((k) => user.permissions.includes(k))) {
      res.status(403).json({ success: false, error: "Forbidden: Insufficient permissions" });
      return;
    }

    next();
  };

/**
 * @deprecated Use `requirePermission()` instead.
 * requireRole(...roles) — variadic role-check middleware.
 * Must be used AFTER authenticate.
 * Returns 403 Forbidden if the user's role is not in the list.
 *
 * This middleware is kept temporarily for backward compatibility during
 * the migration to permission-based authorization. All new code should
 * use `requirePermission()`.
 */
export const requireRole =
  (...roles: string[]): RequestHandler =>
  (req, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    if (!roles.includes(user.role.name)) {
      res.status(403).json({ success: false, error: "Forbidden: Insufficient role" });
      return;
    }

    next();
  };
