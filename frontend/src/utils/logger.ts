import { env } from '@/lib/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, context: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
  }

  info(context: string, message: string, data?: unknown): void {
    console.log(this.formatMessage('info', context, message));
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  warn(context: string, message: string, data?: unknown): void {
    console.warn(this.formatMessage('warn', context, message));
    if (data) console.warn(JSON.stringify(data, null, 2));
  }

  error(context: string, message: string, error?: unknown): void {
    console.error(this.formatMessage('error', context, message));
    if (error instanceof Error) {
      console.error(error.message);
      if (env.isDev && error.stack) console.error(error.stack);
    } else if (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  }

  debug(context: string, message: string, data?: unknown): void {
    if (env.isDev) {
      console.debug(this.formatMessage('debug', context, message));
      if (data) console.debug(JSON.stringify(data, null, 2));
    }
  }
}

export const logger = new Logger();
