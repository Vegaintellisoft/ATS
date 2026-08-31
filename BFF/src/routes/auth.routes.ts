import { Router } from "express";
import { loginHandler, registerHandler, meHandler } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { env } from "../config/env.js";

const router = Router();

// POST /auth/login — public
router.post("/login", loginHandler);

// POST /auth/register — public in development, disabled in production
router.post("/register", (req, res, next) => {
  if (env.nodeEnv === "production") {
    res.status(403).json({
      success: false,
      error: "Registration is disabled in production. Contact an administrator.",
    });
    return;
  }
  next();
}, registerHandler);

// GET /auth/me — authenticated
router.get("/me", authenticate, meHandler);

export default router;
