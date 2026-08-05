import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { env } from "../src/config/env.js";

const prisma = new PrismaClient();

async function main() {
  if (!env.ADMIN_SEED_SECRET) {
    console.log("ADMIN_SEED_SECRET not set; skipping admin seed.");
    return;
  }

  const email = "admin@smit.edu.pk";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("Admin already exists:", existing.email);
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_SEED_SECRET, 12);
  const admin = await prisma.user.create({
    data: {
      name: "SMIT Admin",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Created admin:", admin.email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
