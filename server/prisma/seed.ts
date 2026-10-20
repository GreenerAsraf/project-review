import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const mentorEmail = process.env.INITIAL_MENTOR_EMAIL;
  const mentorPassword = process.env.INITIAL_MENTOR_PASSWORD;
  const mentorName = process.env.INITIAL_MENTOR_NAME || "Lead Mentor";

  console.log("🌱 Checking mentor seed conditions...");

  if (!mentorEmail || !mentorPassword) {
    console.log(
      "ℹ️ Skipping mentor seeding: INITIAL_MENTOR_EMAIL or INITIAL_MENTOR_PASSWORD environment variable not set."
    );
    console.log("   To seed a mentor, set these variables in server/.env and re-run.");
    return;
  }

  const existingMentor = await prisma.user.findUnique({
    where: { email: mentorEmail },
  });

  if (existingMentor) {
    console.log(`ℹ️ Mentor with email "${mentorEmail}" already exists. Seed skipped safely.`);
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(mentorPassword, saltRounds);

  const newMentor = await prisma.user.create({
    data: {
      name: mentorName,
      email: mentorEmail,
      passwordHash,
      role: "MENTOR",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  console.log("✅ Mentor account successfully seeded:");
  console.log(`   ID: ${newMentor.id}`);
  console.log(`   Name: ${newMentor.name}`);
  console.log(`   Email: ${newMentor.email}`);
  console.log(`   Role: ${newMentor.role}`);
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding mentor:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
