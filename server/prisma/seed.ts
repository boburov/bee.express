import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

async function seedSystemRoles() {
  // Default system roles. `isSystem: true` makes them un-deletable from the
  // admin UI (RolesService.remove throws). Slugs are referenced by:
  //   - Server: @Roles("seller"|"courier"|"customer"|"admin")
  //   - Frontend: hasSellerRole / RoleGuard allowed lists
  // Adding a new system role here is the only change needed to expose it
  // panel-wide.
  const systemRoles = [
    {
      slug: "admin",
      name: "Admin",
      description: "Tizim administratori — SuperAdmin tomonidan tayinlanadi.",
      permissions: ["*"],
    },
    {
      slug: "seller",
      name: "Sotuvchi",
      description: "Do'kon egasi — mahsulot, buyurtma va moliyani boshqaradi.",
      permissions: ["seller.*"],
    },
    {
      slug: "courier",
      name: "Kuryer",
      description: "Yetkazib beruvchi — buyurtmani sotuvchidan oladi va xaridorga yetkazadi.",
      permissions: ["courier.*"],
    },
    {
      slug: "customer",
      name: "Xaridor",
      description: "Mini App orqali buyurtma beruvchi foydalanuvchi.",
      permissions: ["customer.*"],
    },
  ];

  for (const role of systemRoles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: { isSystem: true, name: role.name, description: role.description },
      create: { ...role, isSystem: true },
    });
    console.log(`[seed] System role '${role.slug}' ready.`);
  }
}

async function seedSuperAdmin() {
  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;
  const fullName = process.env.SUPERADMIN_FULL_NAME ?? null;

  if (!username || !password) {
    console.warn("[seed] SUPERADMIN_USERNAME/PASSWORD not set — skipping super admin seed.");
    return;
  }

  // In production, refuse to seed a weak/known-default password — a leaked
  // default super-admin is a full platform compromise.
  const WEAK = new Set([
    "ChangeMe!2026",
    "changeme",
    "admin",
    "password",
    "12345678",
    "superadmin",
  ]);
  if (process.env.NODE_ENV === "production" && (password.length < 12 || WEAK.has(password))) {
    throw new Error(
      "[seed] SUPERADMIN_PASSWORD productionda kuchsiz/standart bo'lishi mumkin emas " +
        "(kamida 12 belgi va default qiymat emas).",
    );
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
