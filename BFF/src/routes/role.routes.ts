import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  listRolesHandler,
  getRoleByIdHandler,
  listPermissionsHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
} from "../controllers/role.controller.js";

const router = Router();

// All role routes require the user to be authenticated and have the 'role:manage' permission.
router.use(authenticate);
router.use(requirePermission("role:manage"));

router.get("/", listRolesHandler);
router.get("/permissions", listPermissionsHandler);
router.get("/:id", getRoleByIdHandler);
router.post("/", createRoleHandler);
router.patch("/:id", updateRoleHandler);
router.delete("/:id", deleteRoleHandler);

export default router;
