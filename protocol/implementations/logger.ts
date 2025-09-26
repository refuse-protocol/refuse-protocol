/**
 * @fileoverview Comprehensive logging infrastructure for REFUSE Protocol
 * @description Centralized logging with configurable levels, formatters, and transports
 * @version 1.0.0
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type LogTransport = 'console' | 'file' | 'memory' | 'custom';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  metadata?: Record<string, any>;
  error?: Error;
}

export interface LogFormatter {
  format(entry: LogEntry): string;
}

export interface LogTransport {
  write(entry: LogEntry): void;
  flush?(): void;
  close?(): void;
}

export interface LoggerConfig {
  level: LogLevel;
  context?: string;
  transports: LogTransport[];
  formatters: LogFormatter[];
  metadata?: Record<string, any>;
  enableCorrelationId?: boolean;
  correlationId?: string;
}

/**
 * Default log formatters
 */
export class DefaultFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? `[${entry.context}]` : '';
    const message = entry.message;

    let formatted = `${timestamp} ${level} ${context} ${message}`;

    if (entry.data) {
      formatted += ` ${JSON.stringify(entry.data)}`;
    }

    if (entry.error) {
      formatted += ` ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\n${entry.error.stack}`;
      }
    }

    return formatted;
  }
}

export class JSONFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify(entry);
  }
}

export class ColorFormatter implements LogFormatter {
  private colors: Record<LogLevel, string> = {
    error: '\x1b[31m', // red
    warn: '\x1b[33m',  // yellow
    info: '\x1b[36m',  // cyan
    debug: '\x1b[35m', // magenta
    trace: '\x1b[37m', // white
  };

  private resetColor = '\x1b[0m';

  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const color = this.colors[entry.level] || this.resetColor;
    const level = `${color}${entry.level.toUpperCase()}${this.resetColor}`;
    const context = entry.context ? `[${entry.context}]` : '';
    const message = entry.message;

    return `${timestamp} ${level} ${context} ${message}`;
  }
}

/**
 * Default transports
 */
export class ConsoleTransport implements LogTransport {
  constructor(private formatter: LogFormatter = new DefaultFormatter()) {}

  write(entry: LogEntry): void {
    const formatted = this.formatter.format(entry);

    switch (entry.level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'debug':
        console.debug(formatted);
        break;
      case 'trace':
        console.trace(formatted);
        break;
      default:
        console.log(formatted);
    }
  }
}

export class MemoryTransport implements LogTransport {
  private entries: LogEntry[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  write(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxSize) {
      this.entries = this.entries.slice(-this.maxSize);
    }
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }

  getEntriesByContext(context: string): LogEntry[] {
    return this.entries.filter(entry => entry.context === context);
  }
}

/**
 * Logger configuration manager
 */
export class LoggerConfigManager {
  private static instance: LoggerConfigManager;
  private config: Map<string, LoggerConfig> = new Map();
  private globalConfig: LoggerConfig;

  private constructor() {
    this.globalConfig = {
      level: 'info',
      transports: [new ConsoleTransport()],
      formatters: [new DefaultFormatter()],
      enableCorrelationId: true,
    };
  }

  static getInstance(): LoggerConfigManager {
    if (!LoggerConfigManager.instance) {
      LoggerConfigManager.instance = new LoggerConfigManager();
    }
    return LoggerConfigManager.instance;
  }

  getConfig(context?: string): LoggerConfig {
    return context ? this.config.get(context) || this.globalConfig : this.globalConfig;
  }

  setGlobalConfig(config: Partial<LoggerConfig>): void {
    this.globalConfig = { ...this.globalConfig, ...config };
  }

  setContextConfig(context: string, config: Partial<LoggerConfig>): void {
    const existing = this.config.get(context) || { ...this.globalConfig };
    this.config.set(context, { ...existing, ...config });
  }

  getAllContexts(): string[] {
    return Array.from(this.config.keys());
  }
}

/**
 * Main logger class
 */
export class Logger {
  private config: LoggerConfig;
  private correlationId: string;
  private entryId: number = 0;

  constructor(
    private context?: string,
    config?: Partial<LoggerConfig>
  ) {
    const configManager = LoggerConfigManager.getInstance();
    this.config = configManager.getConfig(context);

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.correlationId = config?.correlationId || this.generateCorrelationId();
  }

  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };

    return levels[level] <= levels[this.config.level];
  }

  private createEntry(level: LogLevel, message: string, data?: any, error?: Error): LogEntry {
    return {
      id: `${this.correlationId}-${++this.entryId}`,
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      data,
      metadata: {
        ...this.config.metadata,
        correlationId: this.config.enableCorrelationId ? this.correlationId : undefined,
      },
      error,
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    for (const transport of this.config.transports) {
      try {
        transport.write(entry);
      } catch (error) {
        // Fallback to console if transport fails
        console.error('Logger transport failed:', error);
        console.error('Original entry:', entry);
      }
    }
  }

  error(message: string, data?: any, error?: Error): void {
    const entry = this.createEntry('error', message, data, error);
    this.log(entry);
  }

  warn(message: string, data?: any): void {
    const entry = this.createEntry('warn', message, data);
    this.log(entry);
  }

  info(message: string, data?: any): void {
    const entry = this.createEntry('info', message, data);
    this.log(entry);
  }

  debug(message: string, data?: any): void {
    const entry = this.createEntry('debug', message, data);
    this.log(entry);
  }

  trace(message: string, data?: any): void {
    const entry = this.createEntry('trace', message, data);
    this.log(entry);
  }

  // Convenience methods
  logError(error: Error, context?: string): void {
    this.error(error.message, context, error);
  }

  logRequest(method: string, url: string, statusCode?: number, duration?: number): void {
    const message = `${method} ${url}`;
    const data = { statusCode, duration };
    this.info(message, data);
  }

  logPerformance(operation: string, duration: number, data?: any): void {
    this.info(`Performance: ${operation}`, { duration, ...data });
  }

  logEvent(event: string, data?: any): void {
    this.info(`Event: ${event}`, data);
  }

  // Child logger
  createChild(context: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger(context, {
      ...this.config,
      ...config,
      correlationId: this.correlationId,
    });
  }

  // Update configuration
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current correlation ID
  getCorrelationId(): string {
    return this.correlationId;
  }
}

/**
 * Global logger factory
 */
export class LoggerFactory {
  private static instance: LoggerFactory;
  private loggers: Map<string, Logger> = new Map();

  private constructor() {}

  static getInstance(): LoggerFactory {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new LoggerFactory();
    }
    return LoggerFactory.instance;
  }

  getLogger(context?: string, config?: Partial<LoggerConfig>): Logger {
    const key = context || 'default';

    if (!this.loggers.has(key)) {
      this.loggers.set(key, new Logger(context, config));
    }

    return this.loggers.get(key)!;
  }

  configureGlobal(config: Partial<LoggerConfig>): void {
    LoggerConfigManager.getInstance().setGlobalConfig(config);
  }

  configureContext(context: string, config: Partial<LoggerConfig>): void {
    LoggerConfigManager.getInstance().setContextConfig(context, config);
    // Clear cached logger to pick up new config
    this.loggers.delete(context);
  }

  clearCache(): void {
    this.loggers.clear();
  }

  getAllContexts(): string[] {
    return LoggerConfigManager.getInstance().getAllContexts();
  }
}

// Global logger instance
export const logger = LoggerFactory.getInstance().getLogger();

// Environment-specific configuration
export const configureEnvironment = (env: string = process.env.NODE_ENV || 'development') => {
  const configManager = LoggerConfigManager.getInstance();

  switch (env) {
    case 'production':
      configManager.setGlobalConfig({
        level: 'warn',
        transports: [new ConsoleTransport()],
        formatters: [new JSONFormatter()],
        enableCorrelationId: true,
      });
      break;

    case 'test':
      configManager.setGlobalConfig({
        level: 'error',
        transports: [new MemoryTransport()],
        formatters: [new JSONFormatter()],
        enableCorrelationId: false,
      });
      break;

    case 'development':
    default:
      configManager.setGlobalConfig({
        level: 'debug',
        transports: [new ConsoleTransport(new ColorFormatter())],
        formatters: [new DefaultFormatter()],
        enableCorrelationId: true,
      });
      break;
  }

  logger.info(`Logger configured for environment: ${env}`);
};

// Auto-configure based on environment
configureEnvironment();
