import type { Request, Response } from "express";
import * as organizationService from "../services/organization.service.js";

export async function createOrganizationHandler(req: Request, res: Response) {
  const { name, slug } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ success: false, error: "Name and slug are required" });
  }
  try {
    const org = await organizationService.createOrganization(name, slug);
    return res.status(201).json({ success: true, data: org });
  } catch (err: any) {
    return res.status(err.httpStatus ?? 500).json({ success: false, error: err.message || "Failed to create organization" });
  }
}

export async function getOrganizationsHandler(req: Request, res: Response) {
  try {
    const orgs = await organizationService.getOrganizations();
    return res.status(200).json({ success: true, data: orgs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch organizations" });
  }
}

export async function updateOrganizationHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { name, slug } = req.body;
  try {
    const org = await organizationService.updateOrganization(id as string, name, slug);
    return res.status(200).json({ success: true, data: org });
  } catch (err: any) {
    return res.status(err.httpStatus ?? 500).json({ success: false, error: err.message || "Failed to update organization" });
  }
}

export async function deleteOrganizationHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await organizationService.deleteOrganization(id as string);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to delete organization" });
  }
}
