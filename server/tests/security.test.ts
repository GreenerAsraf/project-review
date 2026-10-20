import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/services/prisma";
import jwt from "jsonwebtoken";
import { config } from "../src/config";

jest.mock("../src/services/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    submission: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const app = createApp();

describe("Prompt 2C: Security Verification & Edge Cases", () => {
  const studentToken = jwt.sign(
    { userId: "student-sec-id", email: "sec@example.com", role: "STUDENT" },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  const expiredToken = jwt.sign(
    { userId: "student-sec-id", email: "sec@example.com", role: "STUDENT" },
    config.jwtSecret,
    { expiresIn: "-1h" }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Security Test 1: Public signup cannot create MENTOR account", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user-id",
      name: "Attacker",
      email: "attacker@example.com",
      role: "STUDENT",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Attacker",
        email: "attacker@example.com",
        password: "password123",
        role: "MENTOR", // Attempt role escalation
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("STUDENT");
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "STUDENT" }),
      })
    );
  });

  it("Security Test 2: Expired tokens are rejected with 401", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Invalid, expired, or tampered token");
  });

  it("Security Test 3: Request body cannot override studentId in submission", async () => {
    (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.submission.create as jest.Mock).mockResolvedValue({
      id: "sub-1",
      projectName: "Security Test Project",
      repoUrl: "https://github.com/sec/proj",
      description: "Testing studentId injection in request body",
      status: "PENDING",
      studentId: "student-sec-id",
    });

    const res = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        projectName: "Security Test Project",
        repoUrl: "https://github.com/sec/proj",
        description: "Testing studentId injection in request body",
        studentId: "victim-student-id", // Malicious injection attempt
      });

    expect(res.status).toBe(201);
    expect(prisma.submission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "student-sec-id", // Must strictly use token user ID
        }),
      })
    );
  });

  it("Security Test 4: Rejects submission with javascript: URI as invalid URL", async () => {
    const res = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        projectName: "XSS Project",
        repoUrl: "javascript:alert(1)",
        description: "Attempting malicious scheme URL",
      });

    expect(res.status).toBe(400);
  });

  it("Security Test 5: Handles Prisma unique constraint P2002 race conditions gracefully", async () => {
    (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);
    // Simulate database concurrent race condition constraint violation
    const prismaError = new Error("Unique constraint failed");
    (prismaError as unknown as { code: string }).code = "P2002";
    (prisma.submission.create as jest.Mock).mockRejectedValue(prismaError);

    const res = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        projectName: "Concurrent Submission",
        repoUrl: "https://github.com/race/condition",
        description: "Testing race condition handling",
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already submitted this repository URL");
  });
});
