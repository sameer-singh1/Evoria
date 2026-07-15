import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Support both DATABASE_URL (local dev) and separate DB env vars (production)
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Construct DATABASE_URL from separate env vars (used by ECS Fargate)
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT || "3306";
  const dbName = process.env.DB_NAME || "evoria";
  const dbUsername = process.env.DB_USERNAME;
  const dbPassword = process.env.DB_PASSWORD;

  if (!dbHost || !dbUsername || !dbPassword) {
    throw new Error(
      "DATABASE_URL or DB_HOST/DB_USERNAME/DB_PASSWORD must be set"
    );
  }

  databaseUrl = `mysql://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
}

const adapter = new PrismaMariaDb(databaseUrl);

export const prisma = new PrismaClient({ adapter });
