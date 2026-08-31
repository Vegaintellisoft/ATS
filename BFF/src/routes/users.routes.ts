import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  getUsersHandler,
  inviteUserHandler,
  updateUserRoleHandler,
  updateUserTeamHandler,
  updateUserHandler,
  deleteUserHandler,
  getHierarchyHandler,
  getSubordinatesHandler,
} from "../controllers/users.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("user:view"), getUsersHandler);
router.post("/invite", requirePermission("user:create"), inviteUserHandler);
router.patch("/:id/role", requirePermission("role:manage"), updateUserRoleHandler);
router.patch("/:id/team", requirePermission("user:update"), updateUserTeamHandler);
router.patch("/:id", requirePermission("user:update"), updateUserHandler);
router.delete("/:id", requirePermission("user:delete"), deleteUserHandler);
router.get("/:id/hierarchy", requirePermission("user:view"), getHierarchyHandler);
router.get("/:id/subordinates", requirePermission("user:view"), getSubordinatesHandler);

export default router;
