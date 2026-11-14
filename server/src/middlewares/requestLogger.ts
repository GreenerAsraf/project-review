import { Request, Response, NextFunction } from "express";

/**
 * Structured HTTP Request Logger Middleware
 * Logs method, route, status code, and latency in ms.
 * Suppressed in Jest test environment to keep test outputs clean.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor =
      status >= 500
        ? "\x1b[31m" // Red
        : status >= 400
        ? "\x1b[33m" // Yellow
        : status >= 300
        ? "\x1b[36m" // Cyan
        : "\x1b[32m"; // Green
    const reset = "\x1b[0m";

    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl || req.url} ${statusColor}${status}${reset} - ${duration}ms`
    );
  });

  next();
};
