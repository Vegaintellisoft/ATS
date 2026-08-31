import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  getSummaryHandler,
  getManagersHandler,
  getTeamsHandler,
  getActivityHandler,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.use(authenticate);
router.use(requirePermission("dashboard:view"));

router.get("/summary", getSummaryHandler);
router.get("/managers", requirePermission("user:view"), getManagersHandler);
router.get("/teams", requirePermission("team:view"), getTeamsHandler);
router.get("/activity", getActivityHandler);

export default router;
