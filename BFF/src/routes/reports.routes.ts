import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  getAccountReportHandler,
  getRequirementReportHandler,
  getRecruiterReportHandler,
  getManagerReportHandler,
} from "../controllers/reports.controller.js";

const router = Router();

router.use(authenticate);

router.get("/reports/account", requirePermission("report:view"), getAccountReportHandler);
router.get("/reports/requirement", requirePermission("report:view"), getRequirementReportHandler);
router.get("/reports/recruiter", requirePermission("report:view"), getRecruiterReportHandler);
router.get("/reports/manager", requirePermission("report:view"), getManagerReportHandler);

export default router;
