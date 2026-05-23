import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { config } from "./config";

export const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(config.databaseUrl),
});
