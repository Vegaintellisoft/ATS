import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.js";
import { uploadResumes } from "../controllers/resume.controller.js";

const router = Router();

// POST /resume-pipeline
router.post(
  "/resume-pipeline",
  authenticate,
  requirePermission("resume:upload"),
  upload.array("files", 10),
  uploadResumes
);

export default router;
