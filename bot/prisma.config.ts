import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Bot uses a symlinked schema (prisma/schema.prisma -> ../server/prisma/schema.prisma)
 * so the server owns migrations as the single source of truth. The bot only runs
 * `prisma generate` to produce its own typed client into ./node_modules/@prisma/client.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
