import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  createTeamHandler,
  getTeamsHandler,
  updateTeamHandler,
  deleteTeamHandler,
} from "../controllers/teams.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", requirePermission("team:create"), createTeamHandler);
router.get("/", requirePermission("team:view"), getTeamsHandler);
router.patch("/:id", requirePermission("team:update"), updateTeamHandler);
router.delete("/:id", requirePermission("team:delete"), deleteTeamHandler);

export default router;
