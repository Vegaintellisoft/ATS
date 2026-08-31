import { prisma } from "../config/prisma.js";

export async function createTeam(name: string, organizationId: string) {
  return await prisma.team.create({
    data: { name, organizationId },
  });
}

export async function getTeams(organizationId?: string) {
  if (organizationId) {
    return await prisma.team.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }
  return await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTeam(id: string, name: string) {
  return await prisma.team.update({
    where: { id },
    data: { name },
  });
}

export async function deleteTeam(id: string) {
  return await prisma.team.delete({
    where: { id },
  });
}

export async function getTeamById(id: string) {
  return await prisma.team.findUnique({
    where: { id },
  });
}
