import { Request, Response } from "express";
import { prisma } from "../services/prisma";

/**
 * Public endpoint: Returns aggregated platform statistics.
 * No authentication required — used by the homepage stats counter.
 */
export const getPublicStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const [totalSubmissions, approved, pending, totalStudents] =
      await Promise.all([
        prisma.submission.count(),
        prisma.submission.count({ where: { status: "APPROVED" } }),
        prisma.submission.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { role: "STUDENT" } }),
      ]);

    res.status(200).json({
      totalSubmissions,
      approved,
      pending,
      totalStudents,
    });
  } catch (error) {
    console.error("Public stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats." });
  }
};
