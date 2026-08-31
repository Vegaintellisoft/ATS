import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  getAccountsHandler,
  getAccountByIdHandler,
  createAccountHandler,
  updateAccountHandler,
  deleteAccountHandler,
} from "../controllers/account.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("account:view"), getAccountsHandler);
router.get("/:id", requirePermission("account:view"), getAccountByIdHandler);
router.post("/", requirePermission("account:create"), createAccountHandler);
router.patch("/:id", requirePermission("account:update"), updateAccountHandler);
router.delete("/:id", requirePermission("account:delete"), deleteAccountHandler);

export default router;
