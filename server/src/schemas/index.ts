import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["STUDENT", "MENTOR"]).default("STUDENT"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createSubmissionSchema = z.object({
  projectName: z.string().min(3, "Project name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  repoUrl: z.string().url("Valid repository URL is required"),
  liveUrl: z.string().url("Valid live URL is required").optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
