import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate";
import { authenticateJWT, requireRole } from "../middlewares/auth";
import { registerSchema, loginSchema } from "../schemas";
import { authLimiter } from "../middlewares/rateLimit";

const router = Router();

// Public routes with rate limiting and schema validation
router.post("/register", authLimiter, validateRequest(registerSchema), register);
router.post("/login", authLimiter, validateRequest(loginSchema), login);

// Protected profile route
router.get("/me", authenticateJWT, getMe);

// Dedicated mentor route for RBAC testing and verification
router.get(
  "/mentor-only",
  authenticateJWT,
  requireRole(["MENTOR"]),
  (req, res) => {
    res.status(200).json({ message: "Welcome to the mentor exclusive area" });
  }
);

export default router;
