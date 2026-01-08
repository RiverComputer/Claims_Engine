import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Ensure DATABASE_URL is set before any Prisma operations
if (typeof process !== 'undefined' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  // Get DATABASE_URL from environment, default to ./dev.db
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  
  // Ensure it's set in process.env for the adapter
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = dbUrl;
  }
  
  // Create adapter with URL config (not Database instance)
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
