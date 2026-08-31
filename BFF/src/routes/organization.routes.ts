import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  createOrganizationHandler,
  getOrganizationsHandler,
  updateOrganizationHandler,
  deleteOrganizationHandler,
} from "../controllers/organization.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", requirePermission("organization:create"), createOrganizationHandler);
router.get("/", requirePermission("organization:view"), getOrganizationsHandler);
router.patch("/:id", requirePermission("organization:update"), updateOrganizationHandler);
router.delete("/:id", requirePermission("organization:delete"), deleteOrganizationHandler);

export default router;
