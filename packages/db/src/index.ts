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

/**
 * Lazy-initialized Prisma singleton.
 * Won't throw at import time if DATABASE_URL is missing — only on first query.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});

// Re-export Prisma types for convenience
export * from "@prisma/client";
