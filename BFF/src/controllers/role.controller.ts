import type { Request, Response } from "express";
import * as roleService from "../services/role.service.js";
import type { AuthRequest } from "../types/auth.js";

export async function listRolesHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  try {
    // If user is ADMIN they can see all roles, but typically roles are scoped to org.
    // If your app handles multiple orgs, you'd pass user.organizationId. 
    // We'll pass it if the user isn't platform admin.
    const orgId = user.role.name === "ADMIN" ? req.query.organizationId as string : user.organizationId;
    const roles = await roleService.listRoles(orgId);
    return res.status(200).json({ success: true, data: roles });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch roles" });
  }
}

export async function getRoleByIdHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const role = await roleService.getRoleById(id);
    if (!role) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    return res.status(200).json({ success: true, data: role });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch role" });
  }
}

export async function listPermissionsHandler(req: Request, res: Response) {
  try {
    const permissions = await roleService.listPermissions();
    return res.status(200).json({ success: true, data: permissions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch permissions" });
  }
}

export async function createRoleHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  const { name, description, permissionKeys } = req.body;

  if (!name || !permissionKeys || !Array.isArray(permissionKeys)) {
    return res.status(400).json({ success: false, error: "Name and permissionKeys array are required" });
  }

  try {
    const orgId = user.role.name === "ADMIN" ? req.body.organizationId : user.organizationId;
    const newRole = await roleService.createRole({
      name,
      description,
      permissionKeys,
      organizationId: orgId,
    });
    return res.status(201).json({ success: true, data: newRole });
  } catch (err: any) {
    return res.status(err.httpStatus || 500).json({ success: false, error: err.message || "Failed to create role" });
  }
}

export async function updateRoleHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, permissionKeys } = req.body;

  try {
    const updated = await roleService.updateRole(id as string, { name, description, permissionKeys });
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(err.httpStatus || 500).json({ success: false, error: err.message || "Failed to update role" });
  }
}

export async function deleteRoleHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const deleted = await roleService.deleteRole(id as string);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    return res.status(200).json({ success: true, message: "Role deleted successfully" });
  } catch (err: any) {
    return res.status(err.httpStatus || 500).json({ success: false, error: err.message || "Failed to delete role" });
  }
}
