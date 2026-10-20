import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/services/prisma";
import jwt from "jsonwebtoken";
import { config } from "../src/config";

jest.mock("../src/services/prisma", () => ({
  prisma: {
    submission: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const app = createApp();

describe("Prompt 3A: Mentor Dashboard API Tests", () => {
  const mentorToken = jwt.sign(
    { userId: "mentor-uuid-1", email: "mentor@projectpilot.com", role: "MENTOR" },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  const studentToken = jwt.sign(
    { userId: "student-uuid-1", email: "student@example.com", role: "STUDENT" },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/mentor/submissions", () => {
    it("should return paginated submissions, status filter, and aggregate statistics for a MENTOR", async () => {
      // Mock count calls: totalFiltered, pendingCount, approvedCount, rejectedCount
      (prisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(25) // total filtered records
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(12) // approved
        .mockResolvedValueOnce(3);  // rejected

      (prisma.submission.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: "sub-101",
          projectName: "E-Commerce App",
          repoUrl: "https://github.com/student/e-commerce",
          liveUrl: "https://shop.dev",
          description: "Full-stack project description",
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
          student: {
            id: "student-1",
            name: "John Student",
            email: "john@example.com",
          },
        },
      ]);

      const res = await request(app)
        .get("/api/mentor/submissions?page=2&pageSize=10&status=PENDING")
        .set("Authorization", `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.submissions).toHaveLength(1);
      expect(res.body.pagination).toEqual({
        totalRecords: 25,
        totalPages: 3,
        currentPage: 2,
        pageSize: 10,
        hasNextPage: true,
        hasPrevPage: true,
      });
      expect(res.body.stats).toEqual({
        pending: 10,
        approved: 12,
        rejected: 3,
        total: 25,
      });

      // Verify that database query used skip/take for pagination
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
        })
      );
    });

    it("should deny access to STUDENT role with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/mentor/submissions")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Access requires MENTOR role");
    });
  });

  describe("PATCH /api/mentor/submissions/:id/status", () => {
    it("should allow a MENTOR to approve a submission", async () => {
      (prisma.submission.findUnique as jest.Mock).mockResolvedValue({
        id: "sub-101",
        status: "PENDING",
      });

      (prisma.submission.update as jest.Mock).mockResolvedValue({
        id: "sub-101",
        projectName: "E-Commerce App",
        status: "APPROVED",
        student: { id: "student-1", name: "John Student", email: "john@example.com" },
      });

      const res = await request(app)
        .patch("/api/mentor/submissions/sub-101/status")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);
      expect(res.body.submission.status).toBe("APPROVED");
      expect(prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-101" },
          data: { status: "APPROVED" },
        })
      );
    });

    it("should reject invalid status with 400 Validation Error", async () => {
      const res = await request(app)
        .patch("/api/mentor/submissions/sub-101/status")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "INVALID_STATUS" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("should return 404 if the submission does not exist", async () => {
      (prisma.submission.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/mentor/submissions/nonexistent-id/status")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "REJECTED" });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Submission not found");
    });

    it("should block students from updating submission status with 403 Forbidden", async () => {
      const res = await request(app)
        .patch("/api/mentor/submissions/sub-101/status")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(403);
    });
  });
});
