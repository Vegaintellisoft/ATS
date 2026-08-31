import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  getRequirementsHandler,
  getRequirementByIdHandler,
  createRequirementHandler,
  updateRequirementHandler,
  deleteRequirementHandler,
  getRequirementHistoryHandler,
  matchCandidatesHandler,
} from "../controllers/requirement.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("requirement:view"), getRequirementsHandler);
router.get("/:id", requirePermission("requirement:view"), getRequirementByIdHandler);
router.get("/:id/history", requirePermission("requirement:view"), getRequirementHistoryHandler);
router.post("/:id/match", requirePermission("candidate:view"), matchCandidatesHandler);
router.post("/", requirePermission("requirement:create"), createRequirementHandler);
router.patch("/:id", requirePermission("requirement:update"), updateRequirementHandler);
router.delete("/:id", requirePermission("requirement:delete"), deleteRequirementHandler);

export default router;
