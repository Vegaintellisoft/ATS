import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  createApplicationHandler,
  updateApplicationStatusHandler,
  getRequirementApplicationsHandler,
  getApplicationHistoryHandler,
  getAllApplicationsHandler,
} from "../controllers/application.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", requirePermission("application:create"), createApplicationHandler);
router.get("/", requirePermission("application:view"), getAllApplicationsHandler);
router.patch("/:id/status", requirePermission("application:update"), updateApplicationStatusHandler);
router.get("/requirement/:requirementId", requirePermission("application:view"), getRequirementApplicationsHandler);
router.get("/:id/history", requirePermission("application:view"), getApplicationHistoryHandler);

export default router;
