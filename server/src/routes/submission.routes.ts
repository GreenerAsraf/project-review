import { Router } from "express";
import {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  toggleLikeSubmission,
  addComment,
  deleteComment,
} from "../controllers/submission.controller";
import { authenticateJWT, requireRole } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate";
import {
  createSubmissionSchema,
  updateSubmissionSchema,
  createCommentSchema,
} from "../schemas";
import { submissionLimiter } from "../middlewares/rateLimit";

const router = Router();

// All submission routes require a verified token
router.use(authenticateJWT);

// Endpoint for students to view their own submissions
router.get("/my", requireRole(["STUDENT"]), getMySubmissions);

// Social interaction: Like / Unlike project
router.post("/:id/like", toggleLikeSubmission);

// Social interaction: Post comment
router.post(
  "/:id/comments",
  validateRequest(createCommentSchema),
  addComment
);

// Delete comment by ID
router.delete("/comments/:commentId", deleteComment);

// Endpoint to view a specific submission by ID
router.get("/:id", getSubmissionById);

// Edit a PENDING submission (student owner only)
router.patch(
  "/:id",
  requireRole(["STUDENT"]),
  validateRequest(updateSubmissionSchema),
  updateSubmission
);

// Delete submission (student owner or mentor)
router.delete("/:id", deleteSubmission);

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
