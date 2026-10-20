import { Response } from "express";
import { prisma } from "../services/prisma";
import { CreateSubmissionInput } from "../schemas";
import { AuthenticatedRequest } from "../middlewares/auth";

/**
 * Normalizes repository URL:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips trailing slashes
 * - Strips trailing .git suffix
 */
export const normalizeRepoUrl = (url: string): string => {
  return url
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/\.git$/, "");
};

export const createSubmission = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Identity is derived exclusively from verified JWT, never request body
    if (!req.user || req.user.role !== "STUDENT") {
      res.status(403).json({ message: "Forbidden: Only students can submit projects" });
      return;
    }

    const { projectName, description, repoUrl, liveUrl } =
      req.body as CreateSubmissionInput;

    const normalizedRepo = normalizeRepoUrl(repoUrl);

    // Pre-check for duplicate repository submitted by this student
    const existing = await prisma.submission.findFirst({
      where: {
        studentId: req.user.userId,
        repoUrl: normalizedRepo,
      },
    });

    if (existing) {
      res.status(409).json({
        message: "You have already submitted this repository URL.",
      });
      return;
    }

    // Database insertion: handled concurrently and protected by DB constraint
    const submission = await prisma.submission.create({
      data: {
        projectName,
        description,
        repoUrl: normalizedRepo,
        liveUrl: liveUrl && liveUrl.trim().length > 0 ? liveUrl.trim() : null,
        studentId: req.user.userId,
      },
      select: {
        id: true,
        projectName: true,
        repoUrl: true,
        liveUrl: true,
        description: true,
        status: true,
        studentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      message: "Project submission created successfully",
      submission,
    });
  } catch (error: unknown) {
    // Graceful handling of concurrent race conditions via Prisma unique constraint P2002
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        message: "You have already submitted this repository URL.",
      });
      return;
    }

    console.error("Create submission error:", error);
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

export const getMySubmissions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Role-scoped query: students only see their own submissions
    const submissions = await prisma.submission.findMany({
      where: { studentId: req.user.userId },
      select: {
        id: true,
        projectName: true,
        repoUrl: true,
        liveUrl: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ submissions });
  } catch (error) {
    console.error("Get my submissions error:", error);
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

export const getSubmissionById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    // Students cannot view other students' submissions
    if (req.user?.role === "STUDENT" && submission.studentId !== req.user.userId) {
      res.status(403).json({ message: "Forbidden: You cannot view this submission" });
      return;
    }

    res.status(200).json({ submission });
  } catch (error) {
    console.error("Get submission by id error:", error);
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
