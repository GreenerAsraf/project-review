import express, { Application, Request, Response } from "express";
import cors from "cors";
import { config } from "./config";
import { prisma } from "./services/prisma";
import { securityHeaders } from "./middlewares/securityHeaders";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/auth.routes";
import submissionRoutes from "./routes/submission.routes";
import mentorRoutes from "./routes/mentor.routes";
import publicRoutes from "./routes/public.routes";
import userRoutes from "./routes/user.routes";
import commentRoutes from "./routes/comment.routes";

export const createApp = (): Application => {
  const app = express();

  // Production Security Headers
  app.use(securityHeaders);

  // Structured HTTP Request Logger
  app.use(requestLogger);

  // Configured CORS using environment variable CLIENT_URL
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // Extended Health & Observability Endpoint
  app.get("/health", async (_req: Request, res: Response) => {
    const start = Date.now();
    let dbStatus = "connected";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "disconnected";
    }

    const responseTimeMs = Date.now() - start;
    const isHealthy = dbStatus === "connected";

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      responseTimeMs,
      environment: config.nodeEnv,
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/submissions", submissionRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/mentor", mentorRoutes);
  app.use("/api/public", publicRoutes);

  // Fallback 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "API route not found" });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
