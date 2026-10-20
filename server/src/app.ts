import express, { Application, Request, Response } from "express";
import cors from "cors";
import { config } from "./config";
import authRoutes from "./routes/auth.routes";
import submissionRoutes from "./routes/submission.routes";
import mentorRoutes from "./routes/mentor.routes";

export const createApp = (): Application => {
  const app = express();

  // Configured CORS using environment variable CLIENT_URL
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json());

  // Basic Health Check Endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/submissions", submissionRoutes);
  app.use("/api/mentor", mentorRoutes);

  // Fallback 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "API route not found" });
  });

  return app;
};
