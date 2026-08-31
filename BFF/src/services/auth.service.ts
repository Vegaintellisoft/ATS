import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { signToken } from "../utils/jwt.js";

/** Safe user object — never includes the password field. */
export interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  role: { id: string; name: string };
  permissions: string[];
  organizationId: string | null;
  teamId: string | null;
}

export interface AuthResult {
  token: string;
  user: SafeUser;
}

/**
 * login — validates email + password.
 * Throws structured errors with an httpStatus field for the controller.
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  if (!user) {
    const err: any = new Error("User not found");
    err.httpStatus = 404;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    const err: any = new Error("Invalid credentials");
    err.httpStatus = 401;
    throw err;
  }

  const permissions = user.role.permissions.map(rp => rp.permission.key);

  const token = signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: { id: user.role.id, name: user.role.name },
    permissions,
    organizationId: user.organizationId,
    teamId: user.teamId,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: { id: user.role.id, name: user.role.name },
      permissions,
      organizationId: user.organizationId,
      teamId: user.teamId,
    },
  };
}

/**
 * register — creates a new user.
 * Intended for development / admin seeding only.
 * Throws 409 if email already exists.
 */
export async function register(
  email: string,
  password: string,
  roleName: string,
  name?: string,
  organizationId?: string,
  teamId?: string
): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const err: any = new Error("Email already exists");
    err.httpStatus = 409;
    throw err;
  }
  
  const roleRecord = await prisma.role.findFirst({
    where: { name: roleName, organizationId }
  });

  if (!roleRecord) {
    const err: any = new Error(`Role ${roleName} not found`);
    err.httpStatus = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed, roleId: roleRecord.id, name, organizationId, teamId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  const permissions = user.role.permissions.map(rp => rp.permission.key);

  const token = signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: { id: user.role.id, name: user.role.name },
    permissions,
    organizationId: user.organizationId,
    teamId: user.teamId,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: { id: user.role.id, name: user.role.name },
      permissions,
      organizationId: user.organizationId,
      teamId: user.teamId,
    },
  };
}

/**
 * getMe — retrieves an authenticated user by ID.
 * Never returns the password field.
 */
export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  if (!user) {
    const err: any = new Error("User not found");
    err.httpStatus = 404;
    throw err;
  }

  const permissions = user.role.permissions.map(rp => rp.permission.key);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: { id: user.role.id, name: user.role.name },
    permissions,
    organizationId: user.organizationId,
    teamId: user.teamId,
  };
}
