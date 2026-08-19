import { PrismaClient } from '../generated/prisma/client.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? new (PrismaClient as any)();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
