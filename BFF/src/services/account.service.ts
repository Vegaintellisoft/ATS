import { prisma } from "../config/prisma.js";

const ACCOUNT_SELECT = {
  id: true,
  displayName: true,
  source: true,
  keyAccountPersonId: true,
  keyAccountPerson: { select: { id: true, name: true, email: true } },
  contactPerson: true,
  contactEmail: true,
  contactNumber: true,
  address: true,
  status: true,
  remarks: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
};

export async function getAccounts(organizationId: string) {
  return await prisma.account.findMany({
    where: { organizationId },
    select: ACCOUNT_SELECT,
    orderBy: { displayName: "asc" },
  });
}

export async function getAccountById(id: string) {
  return await prisma.account.findUnique({
    where: { id },
    select: ACCOUNT_SELECT,
  });
}

export async function createAccount(data: {
  displayName: string;
  source?: string;
  keyAccountPersonId?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactNumber?: string;
  address?: string;
  status?: "ACTIVE" | "INACTIVE" | "ON_HOLD";
  remarks?: string;
  organizationId: string;
  createdById: string;
}) {
  return await prisma.account.create({
    data,
    select: ACCOUNT_SELECT,
  });
}

export async function updateAccount(id: string, data: Partial<{
  displayName: string;
  source: string;
  keyAccountPersonId: string | null;
  contactPerson: string;
  contactEmail: string;
  contactNumber: string;
  address: string;
  status: "ACTIVE" | "INACTIVE" | "ON_HOLD";
  remarks: string;
}>) {
  return await prisma.account.update({
    where: { id },
    data,
    select: ACCOUNT_SELECT,
  });
}

export async function deleteAccount(id: string) {
  return await prisma.account.delete({
    where: { id },
  });
}
