import type { Request, Response } from "express";
import * as usersService from "../services/users.service.js";
import { AuthRequest } from "../types/auth.js";
import { log } from "console";


export async function getUsersHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  try {
    let users;
    // Platform admins (no organizationId) can query across orgs
    if (!user.organizationId && user.permissions.includes("user:view")) {
      users = await usersService.getUsers(req.query.organizationId as string);
    log(users)
    } else if (user.teamId && !user.permissions.includes("user:create")) {
      // Basic team members can only see their team
      users = await usersService.getUsersByTeam(user.teamId);
      log(users)
    } else {

      // Org admins / HR / Recruitment managers can see everyone in their org
      users = await usersService.getUsers(user.organizationId!);
      log(users)
    } 
    return res.status(200).json({ success: true, data: users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
}

export async function inviteUserHandler(req: Request, res: Response) {
  const { email, role, name, phone, organizationId, teamId, password, employeeCode, contactNumber, department, reportingPersonId } = req.body;
  const user = (req as AuthRequest).user;

  if (!email || !role) {
    return res.status(400).json({ success: false, error: "Email and role are required" });
  }

  // Determine org
  let targetOrgId = organizationId;
  let targetTeamId = teamId;
  
  if (user.organizationId) {
    targetOrgId = user.organizationId; // Force user's org
    
    // If they can't manage roles, they shouldn't be able to invite someone as ADMIN
    if (!user.permissions.includes("role:manage") && role === "ADMIN") {
      return res.status(403).json({ success: false, error: "Cannot create ADMIN users" });
    }
    
    // If they only have basic user:create but not full user:update, restrict them to their team
    if (!user.permissions.includes("user:update")) {
      if (role !== "TEAM_MEMBER") {
        return res.status(403).json({ success: false, error: "You can only create team members" });
      }
      if (!user.teamId) {
        return res.status(403).json({ success: false, error: "You are not assigned to a team" });
      }
      targetTeamId = user.teamId;
    }
  }
  
  try {
    const newUser = await usersService.inviteUser(email, role, name, phone, targetOrgId, targetTeamId, password, employeeCode, contactNumber, department, reportingPersonId);
    // TODO: Actually send an invite email here
    return res.status(201).json({ success: true, data: newUser });
  } catch (err: any) {
    return res.status(err.httpStatus ?? 500).json({ success: false, error: err.message || "Failed to invite user" });
  }
}

export async function updateUserRoleHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body;
  const user = (req as AuthRequest).user;

  if (!role) {
    return res.status(400).json({ success: false, error: "Role is required" });
  }

  try {
    const targetUser = await usersService.getUserById(id as string);
    if (!targetUser) return res.status(404).json({ success: false, error: "User not found" });

    if (user.organizationId) {
      if (targetUser.organizationId !== user.organizationId) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
      if (!user.permissions.includes("role:manage") && role === "ADMIN") {
        return res.status(403).json({ success: false, error: "Cannot promote to ADMIN" });
      }
    }

    const updated = await usersService.updateUserRole(id as string, role);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update role" });
  }
}

export async function updateUserTeamHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { teamId } = req.body;
  const user = (req as AuthRequest).user;

  try {
    const targetUser = await usersService.getUserById(id as string);
    if (!targetUser) return res.status(404).json({ success: false, error: "User not found" });

    if (user.organizationId && targetUser.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const updated = await usersService.updateUserTeam(id as string, teamId ?? null);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update team" });
  }
}

export async function updateUserHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;
  const data = req.body;

  try {
    const targetUser = await usersService.getUserById(id as string);
    if (!targetUser) return res.status(404).json({ success: false, error: "User not found" });

    if (user.organizationId && targetUser.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const updated = await usersService.updateUser(id as string, data);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update user" });
  }
}

export async function getHierarchyHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const chain = await usersService.getReportingHierarchy(id as string);
    return res.status(200).json({ success: true, data: chain });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch hierarchy" });
  }
}

export async function getSubordinatesHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const subs = await usersService.getSubordinates(id as string);
    return res.status(200).json({ success: true, data: subs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch subordinates" });
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;

  try {
    const targetUser = await usersService.getUserById(id as string);
    if (!targetUser) return res.status(404).json({ success: false, error: "User not found" });

    if (user.organizationId) {
      if (targetUser.organizationId !== user.organizationId) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
      if (!user.permissions.includes("user:delete")) {
        // Fallback for limited users trying to delete their own team members
        if (targetUser.teamId !== user.teamId || targetUser.roleId === user.role.id) {
          return res.status(403).json({ success: false, error: "Forbidden: Not in your team" });
        }
      }
    }

    await usersService.deleteUser(id as string);
    console.log({ success: true, data: "User deleted successfully" });
    return res.status(200).json({ success: true, data: "User deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to delete user" });
  }
}
