import { z } from "zod";

// Strict signup schema: Public registration ONLY allows STUDENT role
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(128, "Password cannot exceed 128 characters"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address format"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const createSubmissionSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters long")
    .max(150, "Project name cannot exceed 150 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters long")
    .max(5000, "Description cannot exceed 5000 characters"),
  repoUrl: z
    .string()
    .trim()
    .url("Valid repository URL is required")
    .refine(
      (url) => /^https?:\/\//i.test(url),
      "Repository URL must use http or https protocol"
    ),
  liveUrl: z
    .string()
    .trim()
    .url("Valid live URL is required")
    .refine(
      (url) => /^https?:\/\//i.test(url),
      "Live URL must use http or https protocol"
    )
    .optional()
    .or(z.literal("")),
});

// Mentor review / status update schema
export const updateSubmissionStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    message: "Status must be either APPROVED or REJECTED",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;
