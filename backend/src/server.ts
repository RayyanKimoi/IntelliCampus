import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';

async function startServer(): Promise<void> {
  // Connect to database
  await connectDatabase();

  // Start Express server
  const server = app.listen(env.PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║         IntelliCampus API Server         ║
  ║──────────────────────────────────────────║
  ║  Port:    ${String(env.PORT).padEnd(30)}║
  ║  Env:     ${env.NODE_ENV.padEnd(30)}║
  ║  DB:      PostgreSQL                     ║
  ╚══════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('[Server] Process terminated');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});
