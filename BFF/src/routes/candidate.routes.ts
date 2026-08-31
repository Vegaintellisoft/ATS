import { Router } from "express";
import multer from "multer";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.js";
import {
  uploadCandidate,
  listCandidates,
  getCandidate,
  updateCandidate,
  searchCandidates,
  searchByResume,
  deleteCandidate,
  downloadResume,
  assignCandidate,
  updateCandidateStatus,
  getCandidateDetail,
  getCandidateActivity,
} from "../controllers/candidate.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

// ── Read-only routes ──────────────

router.get("/candidates", requirePermission("candidate:view"), listCandidates);
router.post("/search-candidates", requirePermission("candidate:view"), searchCandidates);
router.post("/search-by-resume", requirePermission("candidate:view"), upload.single("file"), searchByResume);
router.get("/candidates/:id/resume", requirePermission("resume:download"), downloadResume);
router.get("/candidates/:id/detail", requirePermission("candidate:view"), getCandidateDetail);
router.get("/candidates/:id/activity", requirePermission("candidate:view"), getCandidateActivity);

// ── Mutating routes ──────────────

router.post("/candidates", requirePermission("candidate:create"), upload.single("file"), uploadCandidate);
router.get("/candidates/:id", requirePermission("candidate:view"), getCandidate);
router.patch("/candidates/:id", requirePermission("candidate:update"), updateCandidate);

router.delete(
  "/candidates/:id",
  requirePermission("candidate:delete"),
  deleteCandidate
);

router.patch(
  "/candidates/:id/assign",
  requirePermission("candidate:update"),
  assignCandidate
);

router.patch(
  "/candidates/:id/status",
  requirePermission("candidate:update"),
  updateCandidateStatus
);

export default router;
