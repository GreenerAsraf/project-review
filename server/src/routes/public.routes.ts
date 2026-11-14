import { Router } from "express";
import { getPublicStats } from "../controllers/public.controller";

const router = Router();

// GET /api/public/stats — No auth required, used by homepage
router.get("/stats", getPublicStats);

export default router;
