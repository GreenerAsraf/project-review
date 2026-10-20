import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/services/prisma";

const app = createApp();

describe("Prompt 3D: Day 3 Full Integration Workflow Test", () => {
  const timestamp = Date.now();
  const testStudentEmail = `student_${timestamp}@test.com`;
  const testPassword = "Password123!";
  const testProjectName = `Fullstack Coursework ${timestamp}`;
  const testRepoUrl = `https://github.com/student/coursework-${timestamp}.git`;

  let studentToken: string;
  let mentorToken: string;
  let createdSubmissionId: string;

  afterAll(async () => {
    // Cleanup generated test data to keep the database clean
    try {
      if (createdSubmissionId) {
        await prisma.submission.deleteMany({
          where: { repoUrl: { contains: `coursework-${timestamp}` } },
        });
      }
      await prisma.user.deleteMany({
        where: { email: testStudentEmail },
      });
    } catch (e) {
      // Ignore cleanup error
    } finally {
      await prisma.$disconnect();
    }
  });

  it("Step 1: Student can sign up via public registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Integration Student",
        email: testStudentEmail,
        password: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe("STUDENT");
    expect(res.body.token).toBeDefined();
  });

  it("Step 2: Student can log in with registered credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testStudentEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("STUDENT");
    studentToken = res.body.token;
  });

  it("Step 3: Student can submit a project", async () => {
    const res = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        projectName: testProjectName,
        repoUrl: testRepoUrl,
        liveUrl: "https://myproject.vercel.app",
        description: "Full-stack project description for live end-to-end integration test.",
      });

    expect(res.status).toBe(201);
    expect(res.body.submission).toBeDefined();
    expect(res.body.submission.status).toBe("PENDING");
    createdSubmissionId = res.body.submission.id;
  });

  it("Step 4: Student can see their own submission in /api/submissions/my", async () => {
    const res = await request(app)
      .get("/api/submissions/my")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.submissions)).toBe(true);
    const found = res.body.submissions.find(
      (s: { id: string }) => s.id === createdSubmissionId
    );
    expect(found).toBeDefined();
    expect(found.projectName).toBe(testProjectName);
  });

  it("Step 5: Mentor can log in using seeded mentor credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "mentor@projectpilot.com",
        password: "MentorSecurePass2026!",
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("MENTOR");
    mentorToken = res.body.token;
  });

  it("Step 6: Mentor sees the submission, pagination, and stats in dashboard API", async () => {
    const res = await request(app)
      .get("/api/mentor/submissions?page=1&pageSize=10")
      .set("Authorization", `Bearer ${mentorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.submissions).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.total).toBeGreaterThanOrEqual(1);

    const match = res.body.submissions.find(
      (s: { id: string }) => s.id === createdSubmissionId
    );
    expect(match).toBeDefined();
    expect(match.status).toBe("PENDING");
  });

  it("Step 7: Status filter returns only matching submissions", async () => {
    const res = await request(app)
      .get("/api/mentor/submissions?status=PENDING")
      .set("Authorization", `Bearer ${mentorToken}`);

    expect(res.status).toBe(200);
    expect(
      res.body.submissions.every((s: { status: string }) => s.status === "PENDING")
    ).toBe(true);
  });

  it("Step 8: Mentor can approve the submission and persist in database", async () => {
    const res = await request(app)
      .patch(`/api/mentor/submissions/${createdSubmissionId}/status`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ status: "APPROVED" });

    expect(res.status).toBe(200);
    expect(res.body.submission.status).toBe("APPROVED");

    // Verify in database directly
    const inDb = await prisma.submission.findUnique({
      where: { id: createdSubmissionId },
    });
    expect(inDb?.status).toBe("APPROVED");
  });

  it("Step 9: Student now sees updated status 'APPROVED'", async () => {
    const res = await request(app)
      .get("/api/submissions/my")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const updated = res.body.submissions.find(
      (s: { id: string }) => s.id === createdSubmissionId
    );
    expect(updated.status).toBe("APPROVED");
  });

  it("Step 10: Student is blocked from accessing mentor APIs (403 Forbidden)", async () => {
    const res = await request(app)
      .patch(`/api/mentor/submissions/${createdSubmissionId}/status`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ status: "REJECTED" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Forbidden: Access requires MENTOR role");
  });
});
