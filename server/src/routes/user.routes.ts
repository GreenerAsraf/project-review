import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/user.controller";
import { authenticateJWT } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate";
import { updateProfileSchema } from "../schemas";

const router = Router();

// All user routes require a verified JWT
router.use(authenticateJWT);

// GET /api/users/me — View current profile
router.get("/me", getProfile);

// PATCH /api/users/me — Update display name and/or password
router.patch("/me", validateRequest(updateProfileSchema), updateProfile);

export default router;
