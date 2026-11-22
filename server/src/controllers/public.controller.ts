import { Response } from "express";
import { prisma } from "../services/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Prisma } from "@prisma/client";

/**
 * Public endpoint: Returns aggregated platform statistics.
 * No authentication required — used by the homepage stats counter.
 */
export const getPublicStats = async (
  _req: AuthenticatedRequest,
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

/**
 * Public & Peer Showcase endpoint:
 * Fetches approved student projects with pagination, category filter, live search,
 * sorting, and peer engagement metrics (likes & comments counts + isLikedByMe flag).
 *
 * Query params:
 * - page: number (default 1)
 * - pageSize: number (default 12, max 50)
 * - category: string (optional, e.g. "Full Stack", "Frontend", etc.)
 * - search: string (optional, searches project name, description, student name)
 * - filter: "all" | "my" (if "my" and user authenticated, filters to user's approved projects)
 * - sortBy: "newest" | "rating" | "likes" | "oldest" (default: "newest")
 */
export const getPublicShowcase = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.max(1, Math.min(50, parseInt(req.query.pageSize as string, 10) || 12));
    const category = (req.query.category as string)?.trim();
    const search = (req.query.search as string)?.trim();
    const filter = (req.query.filter as string)?.toLowerCase();
    const sortBy = (req.query.sortBy as string)?.toLowerCase();

    // Base condition: only showcase APPROVED submissions
    const whereClause: Prisma.SubmissionWhereInput = {
      status: "APPROVED",
    };

    // Filter by own submissions if requested and authenticated
    if (filter === "my" && req.user) {
      whereClause.studentId = req.user.userId;
    }

    // Filter by track category (if not "all")
    if (category && category.toLowerCase() !== "all") {
      whereClause.category = category;
    }

    // Search by title, description, or student name
    if (search) {
      whereClause.OR = [
        { projectName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { student: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Dynamic order by
    let orderBy: Prisma.SubmissionOrderByWithRelationInput | Prisma.SubmissionOrderByWithRelationInput[];
    if (sortBy === "rating") {
      orderBy = [{ rating: "desc" }, { createdAt: "desc" }];
    } else if (sortBy === "likes") {
      orderBy = { likes: { _count: "desc" } };
    } else if (sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else {
      orderBy = { createdAt: "desc" };
    }

    const currentUserId = req.user?.userId;

    const [totalRecords, submissions] = await Promise.all([
      prisma.submission.count({ where: whereClause }),
      prisma.submission.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          projectName: true,
          description: true,
          repoUrl: true,
          liveUrl: true,
          category: true,
          screenshotUrl: true,
          rating: true,
          feedback: true,
          reviewedAt: true,
          createdAt: true,
          studentId: true,
          student: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          ...(currentUserId
            ? {
                likes: {
                  where: { userId: currentUserId },
                  select: { id: true },
                },
              }
            : {}),
        },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

    // Transform response to include clean metric fields
    const mapped = submissions.map((sub) => {
      const isLikedByMe = currentUserId
        ? Array.isArray((sub as unknown as { likes?: { id: string }[] }).likes) &&
          (sub as unknown as { likes?: { id: string }[] }).likes!.length > 0
        : false;

      // Omit raw likes array from payload
      const { _count, ...rest } = sub as typeof sub & { likes?: unknown };
      delete (rest as { likes?: unknown }).likes;

      return {
        ...rest,
        likesCount: _count.likes,
        commentsCount: _count.comments,
        isLikedByMe,
      };
    });

    res.status(200).json({
      submissions: mapped,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Public showcase error:", error);
    res.status(500).json({ message: "Failed to fetch showcase projects." });
  }
};

/**
 * Featured Showcase endpoint:
 * Fetches top 3 to 5 rated approved projects for the animated hero slideshow.
 */
export const getFeaturedShowcase = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;

    // First attempt: fetch projects with ratings >= 4 or highest rated
    let featured = await prisma.submission.findMany({
      where: {
        status: "APPROVED",
        rating: { not: null },
      },
      take: 5,
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        projectName: true,
        description: true,
        repoUrl: true,
        liveUrl: true,
        category: true,
        screenshotUrl: true,
        rating: true,
        feedback: true,
        reviewedAt: true,
        createdAt: true,
        studentId: true,
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(currentUserId
          ? {
              likes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    // Fallback: If fewer than 3 rated projects, fill with any approved projects
    if (featured.length < 3) {
      featured = await prisma.submission.findMany({
        where: { status: "APPROVED" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          projectName: true,
          description: true,
          repoUrl: true,
          liveUrl: true,
          category: true,
          screenshotUrl: true,
          rating: true,
          feedback: true,
          reviewedAt: true,
          createdAt: true,
          studentId: true,
          student: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          ...(currentUserId
            ? {
                likes: {
                  where: { userId: currentUserId },
                  select: { id: true },
                },
              }
            : {}),
        },
      });
    }

    const mapped = featured.map((sub) => {
      const isLikedByMe = currentUserId
        ? Array.isArray((sub as unknown as { likes?: { id: string }[] }).likes) &&
          (sub as unknown as { likes?: { id: string }[] }).likes!.length > 0
        : false;

      const { _count, ...rest } = sub as typeof sub & { likes?: unknown };
      delete (rest as { likes?: unknown }).likes;

      return {
        ...rest,
        likesCount: _count.likes,
        commentsCount: _count.comments,
        isLikedByMe,
      };
    });

    res.status(200).json({ featured: mapped });
  } catch (error) {
    console.error("Featured showcase error:", error);
    res.status(500).json({ message: "Failed to fetch featured projects." });
  }
};

/**
 * Public Comments endpoint:
 * Fetches all comments for a specific showcase project.
 */
export const getSubmissionComments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!submission) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const comments = await prisma.projectComment.findMany({
      where: { submissionId: id },
      orderBy: { createdAt: "asc" },
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

    res.status(200).json({ comments });
  } catch (error) {
    console.error("Get submission comments error:", error);
    res.status(500).json({ message: "Failed to fetch comments." });
  }
};
