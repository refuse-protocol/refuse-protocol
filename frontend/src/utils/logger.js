/**
 * @fileoverview Frontend logging utility
 * @description Simple logger for frontend JavaScript code
 * @version 1.0.0
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export class FrontendLogger {
  private level: LogLevel = 'info';

  constructor(level?: LogLevel) {
    if (level) {
      this.level = level;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    return levels[level] <= levels[this.level];
  }

  error(message: string, data?: any, error?: Error): void {
    if (!this.shouldLog('error')) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ERROR:`;

    console.error(`${prefix} ${message}`, data || '', error || '');
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] WARN:`;

    console.warn(`${prefix} ${message}`, data || '');
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] INFO:`;

    console.info(`${prefix} ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] DEBUG:`;

    console.debug(`${prefix} ${message}`, data || '');
  }

  // Convenience methods
  logError(error: Error, context?: string): void {
    this.error(error.message, context, error);
  }

  logRequest(method: string, url: string, statusCode?: number, duration?: number): void {
    this.info(`HTTP ${method} ${url}`, { statusCode, duration });
  }

  logPerformance(operation: string, duration: number, data?: any): void {
    this.info(`Performance: ${operation}`, { duration, ...data });
  }

  logEvent(event: string, data?: any): void {
    this.info(`Event: ${event}`, data);
  }
}

// Global logger instance
export const logger = new FrontendLogger();

// Environment-specific configuration
export const configureEnvironment = (env: string = import.meta.env?.MODE || 'development') => {
  switch (env) {
    case 'production':
      logger.level = 'warn';
      break;
    case 'test':
      logger.level = 'error';
      break;
    case 'development':
    default:
      logger.level = 'debug';
      break;
  }
};

// Auto-configure based on environment
configureEnvironment();
