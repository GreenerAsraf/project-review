import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/services/prisma";
import jwt from "jsonwebtoken";
import { config } from "../src/config";

jest.mock("../src/services/prisma", () => ({
  prisma: {
    submission: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const app = createApp();

describe("Prompt 2B: Student Project Submission API Tests", () => {
  const studentToken = jwt.sign(
    { userId: "student-123", email: "student@example.com", role: "STUDENT" },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  const mentorToken = jwt.sign(
    { userId: "mentor-456", email: "mentor@example.com", role: "MENTOR" },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/submissions (Creation)", () => {
    it("should allow a STUDENT to create a valid project submission and normalize URL", async () => {
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.submission.create as jest.Mock).mockResolvedValue({
        id: "sub-1",
        projectName: "Full Stack Dashboard",
        repoUrl: "https://github.com/student/project",
        liveUrl: "https://project.vercel.app",
        description: "A comprehensive project submission dashboard built with Next.js",
        status: "PENDING",
        studentId: "student-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post("/api/submissions")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          projectName: "Full Stack Dashboard",
          repoUrl: "https://github.com/student/project.git/", // Should be normalized
          liveUrl: "https://project.vercel.app",
          description: "A comprehensive project submission dashboard built with Next.js",
          studentId: "malicious-hacked-id", // Attempt to inject studentId in body
        });

      expect(response.status).toBe(201);
      expect(response.body.submission).toBeDefined();
      expect(response.body.submission.projectName).toBe("Full Stack Dashboard");

      // Verify that repoUrl was normalized and studentId came from verified JWT
      expect(prisma.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            repoUrl: "https://github.com/student/project",
            studentId: "student-123",
          }),
        })
      );
    });

    it("should reject submissions with invalid URLs or short fields with 400", async () => {
      const response = await request(app)
        .post("/api/submissions")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          projectName: "Hi", // too short
          repoUrl: "ftp://invalid-url.com", // invalid protocol
          description: "Short", // too short (< 10)
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it("should reject duplicate repository submissions by the same student with 409", async () => {
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue({
        id: "existing-sub",
        repoUrl: "https://github.com/student/project",
        studentId: "student-123",
      });

      const response = await request(app)
        .post("/api/submissions")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          projectName: "Duplicate Project Submission",
          repoUrl: "https://github.com/student/project",
          description: "Attempting to submit an identical repository again",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain("already submitted this repository URL");
    });

    it("should reject unauthenticated submission attempts with 401", async () => {
      const response = await request(app)
        .post("/api/submissions")
        .send({
          projectName: "Anonymous Project",
          repoUrl: "https://github.com/anon/project",
          description: "Valid description without token",
        });

      expect(response.status).toBe(401);
    });

    it("should reject MENTOR role from creating project submissions with 403 Forbidden", async () => {
      const response = await request(app)
        .post("/api/submissions")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({
          projectName: "Mentor Trying to Submit",
          repoUrl: "https://github.com/mentor/project",
          description: "Mentors should not be able to create student submissions",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Forbidden: Access requires STUDENT role");
    });
  });

  describe("GET /api/submissions/my (View Own Submissions)", () => {
    it("should return all submissions belonging to the authenticated student", async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([
        {
          id: "sub-1",
          projectName: "Project Alpha",
          repoUrl: "https://github.com/student/alpha",
          liveUrl: null,
          description: "First submission description",
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .get("/api/submissions/my")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.submissions).toHaveLength(1);
      expect(response.body.submissions[0].projectName).toBe("Project Alpha");
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: "student-123" },
        })
      );
    });
  });
});
