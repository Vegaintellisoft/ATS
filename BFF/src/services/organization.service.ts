import { prisma } from "../config/prisma.js";

export async function createOrganization(name: string, slug: string) {
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    const err: any = new Error("Organization with this slug already exists");
    err.httpStatus = 409;
    throw err;
  }
  return await prisma.organization.create({
    data: { name, slug },
  });
}

export async function getOrganizations() {
  return await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrganization(id: string, name?: string, slug?: string) {
  if (slug) {
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      const err: any = new Error("Organization with this slug already exists");
      err.httpStatus = 409;
      throw err;
    }
  }

  const data: any = {};
  if (name) data.name = name;
  if (slug) data.slug = slug;

  return await prisma.organization.update({
    where: { id },
    data,
  });
}

export async function deleteOrganization(id: string) {
  return await prisma.organization.delete({
    where: { id },
  });
}
