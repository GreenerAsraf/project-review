import rateLimit from "express-rate-limit";

// Rate limiter for student project submission: max 5 requests per 15 minutes per IP
export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many submission attempts. Please try again after 15 minutes.",
  },
});

// Rate limiter for authentication attempts (login/signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
});
