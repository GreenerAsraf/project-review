import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate";
import { authenticateJWT } from "../middlewares/auth";
import { registerSchema, loginSchema } from "../schemas";

const router = Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.get("/me", authenticateJWT, getMe);

export default router;
