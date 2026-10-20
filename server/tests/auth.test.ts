import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/services/prisma";
import jwt from "jsonwebtoken";
import { config } from "../src/config";

// Mock prisma client for unit & route tests
jest.mock("../src/services/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    submission: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const app = createApp();

describe("Prompt 2A: Authentication & RBAC Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register a student and ignore any supplied role or ID in body", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "mock-student-uuid",
        name: "Test Student",
        email: "student@example.com",
        role: "STUDENT",
        createdAt: new Date(),
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test Student",
          email: "student@example.com",
          password: "securePassword123",
          role: "MENTOR", // Attempt to escalate role
          id: "fake-id",   // Attempt to override ID
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe("STUDENT");
      expect(response.body.token).toBeDefined();
      expect(response.body.user.passwordHash).toBeUndefined();

      // Verify Prisma call was strictly given role STUDENT
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "STUDENT",
            email: "student@example.com",
          }),
        })
      );
    });

    it("should return 400 for invalid/missing signup fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "A", // too short
          email: "not-an-email",
          password: "123", // too short
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it("should return 409 if an account with the email already exists", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "existing-uuid",
        email: "student@example.com",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test Student",
          email: "student@example.com",
          password: "securePassword123",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain("already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return 401 for incorrect password or non-existing email", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });
  });

  describe("Protected Endpoint: GET /api/auth/me", () => {
    it("should reject requests without a token with 401", async () => {
      const response = await request(app).get("/api/auth/me");
      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Missing or malformed");
    });

    it("should reject requests with invalid/tampered token with 401", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token-string");

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Invalid, expired, or tampered token");
    });

    it("should return user profile without passwordHash for valid token", async () => {
      const token = jwt.sign(
        { userId: "valid-user-id", email: "student@example.com", role: "STUDENT" },
        config.jwtSecret,
        { expiresIn: "1h" }
      );

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "valid-user-id",
        name: "Test Student",
        email: "student@example.com",
        role: "STUDENT",
        createdAt: new Date(),
      });

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("student@example.com");
      expect(response.body.user.passwordHash).toBeUndefined();
    });
  });

  describe("Role-based Authorization: GET /api/auth/mentor-only", () => {
    it("should return 403 Forbidden when a student tries to access a mentor route", async () => {
      const studentToken = jwt.sign(
        { userId: "student-id", email: "student@example.com", role: "STUDENT" },
        config.jwtSecret,
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .get("/api/auth/mentor-only")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Forbidden: Access requires MENTOR role");
    });

    it("should grant access (200) to a verified MENTOR", async () => {
      const mentorToken = jwt.sign(
        { userId: "mentor-id", email: "mentor@example.com", role: "MENTOR" },
        config.jwtSecret,
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .get("/api/auth/mentor-only")
        .set("Authorization", `Bearer ${mentorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("mentor exclusive");
    });
  });
});
