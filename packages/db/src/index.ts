import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // PrismaNeon accepts PoolConfig directly — it manages the pool internally
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({ adapter });
}

// Singleton pattern — reuse client in dev to avoid exhausting connections
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Re-export Prisma types for convenience
export * from "@prisma/client";
