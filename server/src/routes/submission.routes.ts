import { Router } from "express";
import {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
} from "../controllers/submission.controller";
import { authenticateJWT, requireRole } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate";
import { createSubmissionSchema } from "../schemas";
import { submissionLimiter } from "../middlewares/rateLimit";

const router = Router();

// All submission routes require a verified token
router.use(authenticateJWT);

// Endpoint for students to view their own submissions
router.get("/my", requireRole(["STUDENT"]), getMySubmissions);

// Endpoint to view a specific submission by ID
router.get("/:id", getSubmissionById);

// Only authenticated STUDENT users can create submissions
// Protected by rate limiter, role guard, and Zod validator
router.post(
  "/",
  submissionLimiter,
  requireRole(["STUDENT"]),
  validateRequest(createSubmissionSchema),
  createSubmission
);

export default router;
