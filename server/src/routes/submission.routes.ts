import { Router } from "express";
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
} from "../controllers/submission.controller";
import { authenticateJWT, requireRole } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate";
import { createSubmissionSchema } from "../schemas";

const router = Router();

// Both STUDENT and REVIEWER must be authenticated
router.use(authenticateJWT);

router.get("/", getSubmissions);
router.get("/:id", getSubmissionById);

// Only STUDENT can submit a project
router.post(
  "/",
  requireRole(["STUDENT"]),
  validateRequest(createSubmissionSchema),
  createSubmission
);

export default router;
