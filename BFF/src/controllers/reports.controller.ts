import type { Request, Response } from "express";
import * as reportsService from "../services/reports.service.js";
import { jsonToCsv } from "../utils/csv.js";

function handleExport(res: Response, data: any[], filename: string) {
  const csv = jsonToCsv(data);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  return res.status(200).send(csv);
}

export async function getAccountReportHandler(req: Request, res: Response) {
  const user = (req as any).user;
  try {
    const data = await reportsService.getAccountReport(user.id, user.role.name, user.organizationId);
    if (req.query.export === "csv") {
      return handleExport(res, data, "Account_Report");
    }
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error("Account report failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to generate account report" });
  }
}

export async function getRequirementReportHandler(req: Request, res: Response) {
  const user = (req as any).user;
  try {
    const data = await reportsService.getRequirementReport(user.id, user.role.name, user.organizationId);
    if (req.query.export === "csv") {
      return handleExport(res, data, "Requirement_Report");
    }
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error("Requirement report failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to generate requirement report" });
  }
}

export async function getRecruiterReportHandler(req: Request, res: Response) {
  const user = (req as any).user;
  try {
    const data = await reportsService.getRecruiterReport(user.id, user.role.name, user.organizationId);
    if (req.query.export === "csv") {
      return handleExport(res, data, "Recruiter_Report");
    }
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error("Recruiter report failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to generate recruiter report" });
  }
}

export async function getManagerReportHandler(req: Request, res: Response) {
  const user = (req as any).user;
  try {
    const data = await reportsService.getManagerReport(user.id, user.role.name, user.organizationId);
    if (req.query.export === "csv") {
      return handleExport(res, data, "Manager_Report");
    }
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error("Manager report failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to generate manager report" });
  }
}
