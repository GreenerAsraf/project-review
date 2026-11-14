import { Request, Response, NextFunction } from "express";

/**
 * Production Security Headers Middleware
 * Protects against MIME confusion, Clickjacking, and Cross-Site Scripting (XSS).
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent browsers from MIME-sniffing a response away from the declared content-type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking by forbidding embedding in frames/iframes
  res.setHeader("X-Frame-Options", "DENY");

  // Enable XSS filtering in legacy browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Enforce HTTPS
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Control referrer information sent in HTTP headers
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Disable sensitive hardware access
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  next();
};
