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

    // Filter validation
    let statusFilter: SubmissionStatus | undefined = undefined;
    if (statusQuery && ["PENDING", "APPROVED", "REJECTED"].includes(statusQuery.toUpperCase())) {
      statusFilter = statusQuery.toUpperCase() as SubmissionStatus;
    }

    const whereClause = statusFilter ? { status: statusFilter } : {};

    // Execute optimized parallel database queries without loading full tables into memory
    const [totalRecords, submissions, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        prisma.submission.count({ where: whereClause }),
        prisma.submission.findMany({
          where: whereClause,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            projectName: true,
            repoUrl: true,
            liveUrl: true,
            description: true,
            status: true,
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
 * Mentor-only endpoint: Approve or Reject a submission by ID
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
    const { status } = req.body as UpdateSubmissionStatusInput;

    const existingSubmission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!existingSubmission) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        projectName: true,
        repoUrl: true,
        liveUrl: true,
        description: true,
        status: true,
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
