import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

async function seedSystemRoles() {
  await prisma.role.upsert({
    where: { slug: "admin" },
    update: { isSystem: true },
    create: {
      slug: "admin",
      name: "Admin",
      description: "Tizim administratori — SuperAdmin tomonidan tayinlanadi.",
      isSystem: true,
      permissions: ["*"],
    },
  });
  console.log("[seed] System role 'admin' ready.");
}

async function seedSuperAdmin() {
  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;
  const fullName = process.env.SUPERADMIN_FULL_NAME ?? null;

  if (!username || !password) {
    console.warn("[seed] SUPERADMIN_USERNAME/PASSWORD not set — skipping super admin seed.");
    return;
  }

  const existing = await prisma.superAdmin.findUnique({ where: { username } });
  if (existing) {
    console.log(`[seed] SuperAdmin "${username}" already exists — skipping.`);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.superAdmin.create({
    data: { username, password: hash, fullName },
  });
  console.log(`[seed] SuperAdmin "${username}" created.`);
}

async function main() {
  await seedSystemRoles();
  await seedSuperAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
