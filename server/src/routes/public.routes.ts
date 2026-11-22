import { Router } from "express";
import {
  getPublicStats,
  getPublicShowcase,
  getFeaturedShowcase,
  getSubmissionComments,
} from "../controllers/public.controller";
import { optionalAuthenticateJWT } from "../middlewares/auth";

const router = Router();

// GET /api/public/stats — Platform overview statistics
router.get("/stats", getPublicStats);

// GET /api/public/showcase — Approved projects exhibition gallery with search/filters/pagination
router.get("/showcase", optionalAuthenticateJWT, getPublicShowcase);

// GET /api/public/showcase/featured — Top rated projects for hero slideshow
router.get("/showcase/featured", optionalAuthenticateJWT, getFeaturedShowcase);

// GET /api/public/submissions/:id/comments — All comments for a showcase project
router.get("/submissions/:id/comments", getSubmissionComments);

export default router;
