import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  name: string | null;
  email: string;
  role: { id: string; name: string };
  permissions: string[];
  organizationId: string | null;
  teamId: string | null;
}

/**
 * Sign a JWT token containing user id, email, role, and permissions.
 * Expires in env.jwtExpiresIn (default: 7d).
 */
export function signToken(user: { 
  id: string; 
  name: string | null; 
  email: string; 
  role: { id: string; name: string }; 
  permissions: string[]; 
  organizationId: string | null; 
  teamId: string | null; 
}): string {
  const payload: JwtPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    organizationId: user.organizationId,
    teamId: user.teamId,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verify a JWT token and return the decoded payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
