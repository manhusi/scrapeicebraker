import { PrismaClient } from "@prisma/client";

// Egy Prisma kliens az egész appra (egy forrás-igazság, CONSTITUTION 8.).
// Next.js dev hot-reload alatt elkerüljük a több példányt.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
