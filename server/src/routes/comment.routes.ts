import { Router } from "express";
import { deleteComment } from "../controllers/submission.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Delete a comment by ID (must be comment author or mentor)
router.use(authenticateJWT);
router.delete("/:commentId", deleteComment);

export default router;
