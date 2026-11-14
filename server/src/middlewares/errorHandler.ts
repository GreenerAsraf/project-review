import { Request, Response, NextFunction } from "express";

/**
 * Centralized Error Handling Middleware
 * Catches unhandled runtime exceptions, JSON parsing errors, and database failures.
 * Never leaks stack traces, environment variables, or raw SQL queries in production.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Catch bad JSON payloads
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: "Bad Request",
      message: "Malformed JSON payload format",
    });
    return;
  }

  const message =
    err instanceof Error ? err.message : "An internal server error occurred";

  // Log server errors for observability
  if (process.env.NODE_ENV !== "test") {
    console.error("[ServerError]", err);
  }

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again later."
        : message,
  });
};
