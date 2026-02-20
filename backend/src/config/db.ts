import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.isDev) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] PostgreSQL connected successfully');
  } catch (error) {
    console.warn('[DB] WARNING: Could not connect to PostgreSQL. Starting server in offline mode.');
    console.warn('[DB] API endpoints requiring DB will return errors, but the server will still run.');
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('[DB] PostgreSQL disconnected');
}
