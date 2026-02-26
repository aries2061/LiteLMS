import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma Client for MariaDB/MySQL.
 * Uses the Prisma 7 driver adapter pattern.
 * In development, hot-reloading would create many instances.
 * This pattern reuses the client across module reloads.
 */
function createPrismaClient(): PrismaClient {
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
