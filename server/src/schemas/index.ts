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
  category: z
    .enum(["Full Stack", "Frontend", "API & Backend", "Mobile", "UI/UX"])
    .optional(),
  screenshotUrl: z
    .string()
    .trim()
    .url("Screenshot URL must be a valid URL starting with http:// or https://")
    .optional()
    .or(z.literal("")),
});

// Mentor review / evaluation schema — includes star rating and feedback
export const updateSubmissionStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    message: "Status must be either APPROVED or REJECTED",
  }),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  feedback: z
    .string()
    .trim()
    .min(5, "Feedback must be at least 5 characters")
    .max(2000, "Feedback cannot exceed 2000 characters")
    .optional(),
});

// Student edit submission schema (only allowed on PENDING submissions)
export const updateSubmissionSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters long")
    .max(150, "Project name cannot exceed 150 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters long")
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),
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
  category: z
    .enum(["Full Stack", "Frontend", "API & Backend", "Mobile", "UI/UX"])
    .optional(),
  screenshotUrl: z
    .string()
    .trim()
    .url("Screenshot URL must be a valid URL starting with http:// or https://")
    .optional()
    .or(z.literal("")),
});

// User profile and password update schema
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    currentPassword: z
      .string()
      .min(1, "Current password is required to change password")
      .optional(),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long")
      .max(128, "New password cannot exceed 128 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    {
      message: "Current password must be provided to set a new password",
      path: ["currentPassword"],
    }
  );

// Comment creation schema
export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "Comment must be at least 2 characters long")
    .max(400, "Comment cannot exceed 400 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
