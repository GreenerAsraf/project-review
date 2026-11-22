import { Response } from "express";
import { prisma } from "../services/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";
import { SubmissionStatus } from "@prisma/client";
import { UpdateSubmissionStatusInput } from "../schemas";

/**
 * Mentor-only endpoint: List all submissions with server-side pagination,
 * status filtering, newest-first sorting, and aggregated statistics.
 *
 * Query params:
 * - page: number (default 1)
 * - pageSize: number (default 10)
 * - status: 'PENDING' | 'APPROVED' | 'REJECTED' (optional filter)
 * - search: string (optional — project name, student name or email)
 * - sortBy: 'oldest' | 'project' | default newest
 */
export const getMentorSubmissions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== "MENTOR") {
      res.status(403).json({ message: "Forbidden: Access requires MENTOR role" });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.max(1, Math.min(50, parseInt(req.query.pageSize as string, 10) || 10));
    const statusQuery = req.query.status as string | undefined;
    const search = (req.query.search as string)?.trim();
    const sortBy = (req.query.sortBy as string)?.toLowerCase();

    // Filter validation
    let statusFilter: SubmissionStatus | undefined = undefined;
    if (statusQuery && ["PENDING", "APPROVED", "REJECTED"].includes(statusQuery.toUpperCase())) {
      statusFilter = statusQuery.toUpperCase() as SubmissionStatus;
    }

    const whereClause: Record<string, unknown> = statusFilter ? { status: statusFilter } : {};

    if (search) {
      whereClause.OR = [
        { projectName: { contains: search, mode: "insensitive" } },
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orderBy =
      sortBy === "oldest"
        ? { createdAt: "asc" as const }
        : sortBy === "project"
        ? { projectName: "asc" as const }
        : { createdAt: "desc" as const };

    // Execute optimized parallel database queries
    const [totalRecords, submissions, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        prisma.submission.count({ where: whereClause }),
        prisma.submission.findMany({
          where: whereClause,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy,
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
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.submission.count({ where: { status: "PENDING" } }),
        prisma.submission.count({ where: { status: "APPROVED" } }),
        prisma.submission.count({ where: { status: "REJECTED" } }),
      ]);

    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

    res.status(200).json({
      submissions,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      },
    });
  } catch (error) {
    console.error("Mentor get submissions error:", error);
    res.status(500).json({ message: "An unexpected error occurred while fetching mentor submissions." });
  }
};

/**
 * Mentor-only endpoint: Approve or Reject a submission with optional star rating and feedback
 * PATCH /api/mentor/submissions/:id/status
 */
export const updateSubmissionStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== "MENTOR") {
      res.status(403).json({ message: "Forbidden: Access requires MENTOR role" });
      return;
    }

    const id = req.params.id as string;
    const { status, rating, feedback } = req.body as UpdateSubmissionStatusInput;

    const existingSubmission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!existingSubmission) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        rating: rating ?? null,
        feedback: feedback ?? null,
        reviewedAt: new Date(),
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
        rating: true,
        feedback: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: `Submission status successfully updated to ${status}`,
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Update submission status error:", error);
    res.status(500).json({ message: "An unexpected error occurred while updating submission status." });
  }
};
