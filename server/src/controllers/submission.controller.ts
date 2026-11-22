import { Response } from "express";
import { prisma } from "../services/prisma";
import {
  CreateSubmissionInput,
  UpdateSubmissionInput,
  CreateCommentInput,
} from "../schemas";
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

    const { projectName, description, repoUrl, liveUrl, category, screenshotUrl } =
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
        category: category ?? "Full Stack",
        screenshotUrl: screenshotUrl && screenshotUrl.trim().length > 0 ? screenshotUrl.trim() : null,
        studentId: req.user.userId,
      },
      select: {
        id: true,
        projectName: true,
        repoUrl: true,
        liveUrl: true,
        description: true,
        category: true,
        screenshotUrl: true,
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
        category: true,
        screenshotUrl: true,
        status: true,
        rating: true,
        feedback: true,
        reviewedAt: true,
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
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!submission) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    // Public showcase projects can be viewed by anyone; pending/rejected can only be viewed by owner or mentor
    if (
      submission.status !== "APPROVED" &&
      req.user?.role === "STUDENT" &&
      submission.studentId !== req.user.userId
    ) {
      res.status(403).json({ message: "Forbidden: You cannot view this submission" });
      return;
    }

    res.status(200).json({ submission });
  } catch (error) {
    console.error("Get submission by id error:", error);
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

/**
 * Student endpoint: Edit a PENDING submission
 * PATCH /api/submissions/:id
 */
export const updateSubmission = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== "STUDENT") {
      res.status(403).json({ message: "Forbidden: Only students can edit submissions" });
      return;
    }

    const id = req.params.id as string;
    const { projectName, description, liveUrl, category, screenshotUrl } = req.body as UpdateSubmissionInput;

    const existing = await prisma.submission.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    if (existing.studentId !== req.user.userId) {
      res.status(403).json({ message: "Forbidden: You do not own this submission" });
      return;
    }

    if (existing.status !== "PENDING") {
      res.status(400).json({
        message: `Cannot edit a submission that has already been ${existing.status.toLowerCase()}`,
      });
      return;
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        ...(projectName ? { projectName } : {}),
        ...(description ? { description } : {}),
        ...(liveUrl !== undefined
          ? { liveUrl: liveUrl && liveUrl.trim().length > 0 ? liveUrl.trim() : null }
          : {}),
        ...(category ? { category } : {}),
        ...(screenshotUrl !== undefined
          ? { screenshotUrl: screenshotUrl && screenshotUrl.trim().length > 0 ? screenshotUrl.trim() : null }
          : {}),
      },
      select: {
        id: true,
        projectName: true,
        repoUrl: true,
        liveUrl: true,
        description: true,
        category: true,
        screenshotUrl: true,
        status: true,
        studentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: "Submission updated successfully",
      submission: updated,
    });
  } catch (error) {
    console.error("Update submission error:", error);
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

/**
 * Student/Author endpoint: Delete own submission (removes with cascade)
 * DELETE /api/submissions/:id
 */
export const deleteSubmission = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const id = req.params.id as string;

    const existing = await prisma.submission.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    // Owner can delete their own project; mentors can also moderate
    if (existing.studentId !== req.user.userId && req.user.role !== "MENTOR") {
      res.status(403).json({ message: "Forbidden: You do not have permission to delete this submission" });
      return;
    }

    await prisma.submission.delete({
      where: { id },
    });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete submission error:", error);
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

/**
 * Social endpoint: Toggle like on an approved project
 * POST /api/submissions/:id/like
 */
export const toggleLikeSubmission = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required to like projects" });
      return;
    }

    const submissionId = req.params.id as string;
    const userId = req.user.userId;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true },
    });

    if (!submission) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Check if like exists
    const existingLike = await prisma.projectLike.findUnique({
      where: {
        unique_submission_like: {
          submissionId,
          userId,
        },
      },
    });

    let isLiked = false;

    if (existingLike) {
      // Unlike
      await prisma.projectLike.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      // Like
      await prisma.projectLike.create({
        data: {
          submissionId,
          userId,
        },
      });
      isLiked = true;
    }

    const likesCount = await prisma.projectLike.count({
      where: { submissionId },
    });

    res.status(200).json({
      message: isLiked ? "Project liked" : "Project unliked",
      isLiked,
      likesCount,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({ message: "Failed to update project like." });
  }
};

/**
 * Social endpoint: Add a comment to a project
 * POST /api/submissions/:id/comments
 */
export const addComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required to post comments" });
      return;
    }

    const submissionId = req.params.id as string;
    const { content } = req.body as CreateCommentInput;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    });

    if (!submission) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const comment = await prisma.projectComment.create({
      data: {
        submissionId,
        userId: req.user.userId,
        content: content.trim(),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Comment posted successfully",
      comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Failed to post comment." });
  }
};

/**
 * Social endpoint: Delete own comment (or mentor moderate)
 * DELETE /api/comments/:commentId
 */
export const deleteComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const commentId = req.params.commentId as string;

    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.userId !== req.user.userId && req.user.role !== "MENTOR") {
      res.status(403).json({ message: "Forbidden: You cannot delete another user's comment" });
      return;
    }

    await prisma.projectComment.delete({
      where: { id: commentId },
    });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Failed to delete comment." });
  }
};
