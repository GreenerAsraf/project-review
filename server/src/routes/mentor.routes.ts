import { Router } from "express";
import {
  getMentorSubmissions,
  updateSubmissionStatus,
} from "../controllers/mentor.controller";
import { authenticateJWT, requireRole } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate";
import { updateSubmissionStatusSchema } from "../schemas";

const router = Router();

// Strict Mentor route protection: Requires valid JWT and verified MENTOR role
router.use(authenticateJWT);
router.use(requireRole(["MENTOR"]));

// GET /api/mentor/submissions - List with pagination, filters, stats
router.get("/submissions", getMentorSubmissions);

// PATCH /api/mentor/submissions/:id/status - Approve or reject a submission
router.patch(
  "/submissions/:id/status",
  validateRequest(updateSubmissionStatusSchema),
  updateSubmissionStatus
);

export default router;
