import { Response } from "express";
import { prisma } from "../services/prisma";
import { CreateSubmissionInput } from "../schemas";
import { AuthenticatedRequest } from "../middlewares/auth";

/**
 * Normalizes repository URL by trimming, removing trailing slashes,
 * converting to lowercase, and removing trailing .git
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
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { projectName, description, repoUrl, liveUrl } =
      req.body as CreateSubmissionInput;

    const normalizedRepo = normalizeRepoUrl(repoUrl);

    // Check duplicate repository submission for this student
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

    const submission = await prisma.submission.create({
      data: {
        projectName,
        description,
        repoUrl: normalizedRepo,
        liveUrl: liveUrl || null,
        studentId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Submission created successfully",
      submission,
    });
  } catch (error: unknown) {
    // Handle Prisma unique constraint violation code P2002
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      res.status(409).json({
        message: "You have already submitted this repository URL.",
      });
      return;
    }
    console.error("Create submission error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSubmissions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const whereClause =
      req.user.role === "STUDENT" ? { studentId: req.user.userId } : {};

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ submissions });
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ message: "Internal server error" });
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

    if (req.user?.role === "STUDENT" && submission.studentId !== req.user.userId) {
      res.status(403).json({ message: "Forbidden: You cannot view this submission" });
      return;
    }

    res.status(200).json({ submission });
  } catch (error) {
    console.error("Get submission by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
