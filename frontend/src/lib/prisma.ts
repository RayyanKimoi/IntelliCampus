import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle hot reload in development
if (typeof window === 'undefined') {
  // Ensure connection on serverless/edge
  prisma.$connect().catch((err) => {
    console.error('[Prisma] Connection error:', err.message);
  });
}

// Helper function to handle Prisma queries with automatic reconnection
export async function withPrisma<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await operation(prisma);
  } catch (error: any) {
    // Retry once on connection errors
    if (
      error.code === 'P1017' || 
      error.message?.includes('closed') ||
      error.message?.includes('connection')
    ) {
      console.log('[Prisma] Reconnecting due to connection error...');
      await prisma.$connect();
      return await operation(prisma);
    }
    throw error;
  }
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] PostgreSQL connected successfully');
  } catch (error) {
    console.error('[DB] Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('[DB] PostgreSQL disconnected');
}
