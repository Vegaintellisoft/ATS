import { log } from "console";
import { prisma } from "../config/prisma.js";
import { register } from "./auth.service.js";

const USER_SELECT = {
  id: true, name: true, email: true, phone: true, employeeCode: true,
  contactNumber: true, department: true, status: true, exception: true,
  role: true, organizationId: true, teamId: true,
  reportingPersonId: true,
  reportingPerson: { select: { id: true, name: true, email: true } },
  createdAt: true,
};

export async function getUsers(organizationId?: string) {
  return await prisma.user.findMany({
    where: organizationId ? { organizationId } : undefined,
    select: USER_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getUsersByTeam(teamId: string) {
  return await prisma.user.findMany({
    where: { teamId },
    select: USER_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function inviteUser(
  email: string, role: string, name?: string, phone?: string,
  organizationId?: string, teamId?: string, password?: string,
  employeeCode?: string, contactNumber?: string, department?: string,
  reportingPersonId?: string
) {
  const userPassword = password || Math.random().toString(36).slice(-8);
  const result = await register(email, userPassword, role, name, organizationId, teamId);
  // Update additional fields
  const updateData: any = {};
  if (phone) updateData.phone = phone;
  if (employeeCode) updateData.employeeCode = employeeCode;
  if (contactNumber) updateData.contactNumber = contactNumber;
  if (department) updateData.department = department;
  if (reportingPersonId) updateData.reportingPersonId = reportingPersonId;

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id: result.user.id }, data: updateData });
  }

  return result.user;
}

export async function updateUserRole(id: string, roleName: string) {
  const role = await prisma.role.findFirst({
    where: { name: roleName, organizationId: null }
  });
  if (!role) throw new Error(`Role ${roleName} not found`);

  return await prisma.user.update({
    where: { id },
    data: { roleId: role.id },
    select: USER_SELECT,
  });
}

export async function updateUserTeam(id: string, teamId: string | null) {
  return await prisma.user.update({
    where: { id },
    data: { teamId },
    select: USER_SELECT,
  });
}

export async function updateUser(id: string, data: {
  name?: string; email?: string; phone?: string; employeeCode?: string;
  contactNumber?: string; department?: string;
  reportingPersonId?: string | null; exception?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role?: string;
}) {
  const { role, ...rest } = data;
  const updateData: any = { ...rest };

  if (role) {
    const roleObj = await prisma.role.findFirst({
      where: { name: role }
    });
    if (roleObj) {
      updateData.roleId = roleObj.id;
    }
  }

  return await prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_SELECT,
  });
}

export async function deleteUser(id: string) {
  return await prisma.user.delete({ where: { id } });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    select: { ...USER_SELECT, roleId: true },
  });
}

/** Walk the reporting chain upward from a user to the root (exception=true or null reportingPerson) */
export async function getReportingHierarchy(userId: string) {
  const chain: any[] = [];
  let currentId: string | null = userId;

  while (currentId) {
    const userModel: any = await prisma.user.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, email: true, role: true, department: true, exception: true, reportingPersonId: true },
    });
    if (!userModel) break;
    chain.push(userModel);
    if (userModel.exception || !userModel.reportingPersonId) break;
    currentId = userModel.reportingPersonId;
  }

  return chain;
}

/** Get direct subordinates of a user */
export async function getSubordinates(userId: string) {
  return await prisma.user.findMany({
    where: { reportingPersonId: userId },
    select: USER_SELECT,
    orderBy: { name: "asc" },
  });
}
