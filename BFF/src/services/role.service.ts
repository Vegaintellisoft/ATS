import { prisma } from "../config/prisma.js";

/* ── Queries ──────────────────────────────────────────────── */

/** List all roles (optionally scoped to an organization), with permission keys and user count. */
export async function listRoles(organizationId?: string | null) {
  const roles = await prisma.role.findMany({
    where: organizationId ? { OR: [{ organizationId }, { organizationId: null }] } : undefined,
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    organizationId: r.organizationId,
    permissions: r.permissions.map((rp) => rp.permission.key),
    userCount: r._count.users,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/** Get a single role by ID with its permission keys and user count. */
export async function getRoleById(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  if (!role) return null;

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    organizationId: role.organizationId,
    permissions: role.permissions.map((rp) => rp.permission.key),
    userCount: role._count.users,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

/** List every available permission key (for the frontend permission grid). */
export async function listPermissions() {
  return await prisma.permission.findMany({
    orderBy: { key: "asc" },
  });
}

/* ── Mutations ────────────────────────────────────────────── */

/** Create a new role with the given permission keys. */
export async function createRole(data: {
  name: string;
  description?: string;
  permissionKeys: string[];
  organizationId?: string | null;
}) {
  // Validate permission keys exist
  const permissions = await prisma.permission.findMany({
    where: { key: { in: data.permissionKeys } },
  });

  const foundKeys = permissions.map((p) => p.key);
  const invalidKeys = data.permissionKeys.filter((k) => !foundKeys.includes(k));
  if (invalidKeys.length > 0) {
    const err: any = new Error(`Invalid permission keys: ${invalidKeys.join(", ")}`);
    err.httpStatus = 400;
    throw err;
  }

  // Check for duplicate role name within the same org scope
  const existing = await prisma.role.findFirst({
    where: { name: data.name, organizationId: data.organizationId ?? null },
  });
  if (existing) {
    const err: any = new Error(`Role "${data.name}" already exists`);
    err.httpStatus = 409;
    throw err;
  }

  const role = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      organizationId: data.organizationId ?? null,
    },
  });

  // Create role-permission links
  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        roleId: role.id,
        permissionId: p.id,
      })),
    });
  }

  return getRoleById(role.id);
}

/** Update an existing role's name, description, and/or permissions. */
export async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissionKeys?: string[] }
) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    const err: any = new Error("Role not found");
    err.httpStatus = 404;
    throw err;
  }

  // Update name/description
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  if (Object.keys(updateData).length > 0) {
    // Check for duplicate name if name is changing
    if (data.name && data.name !== role.name) {
      const existing = await prisma.role.findFirst({
        where: { name: data.name, organizationId: role.organizationId },
      });
      if (existing) {
        const err: any = new Error(`Role "${data.name}" already exists`);
        err.httpStatus = 409;
        throw err;
      }
    }

    await prisma.role.update({ where: { id }, data: updateData });
  }

  // Update permissions (replace all)
  if (data.permissionKeys !== undefined) {
    const permissions = await prisma.permission.findMany({
      where: { key: { in: data.permissionKeys } },
    });

    const foundKeys = permissions.map((p) => p.key);
    const invalidKeys = data.permissionKeys.filter((k) => !foundKeys.includes(k));
    if (invalidKeys.length > 0) {
      const err: any = new Error(`Invalid permission keys: ${invalidKeys.join(", ")}`);
      err.httpStatus = 400;
      throw err;
    }

    // Delete all existing, then re-create
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId: id,
          permissionId: p.id,
        })),
      });
    }
  }

  return getRoleById(id);
}

/** Delete a role. Throws 400 if users are still assigned. */
export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!role) {
    const err: any = new Error("Role not found");
    err.httpStatus = 404;
    throw err;
  }

  if (role._count.users > 0) {
    const err: any = new Error(
      `Cannot delete role "${role.name}" — ${role._count.users} user(s) are still assigned. Reassign them first.`
    );
    err.httpStatus = 400;
    throw err;
  }

  // Delete permission links first, then the role
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  await prisma.role.delete({ where: { id } });

  return { deleted: true };
}
