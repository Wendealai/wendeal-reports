// 改进的结构化日志系统
// 符合Node.js最佳实践的日志实现

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVEL_NAMES = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.FATAL]: "FATAL",
};

// 获取当前环境的日志级别
const getLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();

  switch (envLevel) {
    case "DEBUG":
      return LogLevel.DEBUG;
    case "INFO":
      return LogLevel.INFO;
    case "WARN":
      return LogLevel.WARN;
    case "ERROR":
      return LogLevel.ERROR;
    case "FATAL":
      return LogLevel.FATAL;
    default:
      // 开发环境默认DEBUG，生产环境默认INFO
      return process.env.NODE_ENV === "development"
        ? LogLevel.DEBUG
        : LogLevel.INFO;
  }
};

const currentLogLevel = getLogLevel();
const isDevelopment = process.env.NODE_ENV === "development";

// 格式化日志输出
const formatLogEntry = (entry: LogEntry): string => {
  if (isDevelopment) {
    // 开发环境：可读性友好的格式
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    let formatted = `[${timestamp}] ${entry.level}`;

    if (entry.module) {
      formatted += ` [${entry.module}]`;
    }

    formatted += `: ${entry.message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    if (entry.error) {
      formatted += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return formatted;
  } else {
    // 生产环境：结构化JSON格式
    return JSON.stringify(entry);
  }
};

// 输出日志到适当的流
const outputLog = (level: LogLevel, formattedMessage: string): void => {
  if (typeof window !== "undefined") {
    // 浏览器环境
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
    }
  } else {
    // Node.js环境
    const output = level >= LogLevel.ERROR ? process.stderr : process.stdout;
    output.write(formattedMessage + "\n");
  }
};

// 创建日志条目
const createLogEntry = (
  level: LogLevel,
  message: string,
  module?: string,
  metadata?: Record<string, unknown>,
  error?: Error,
): LogEntry => ({
  timestamp: new Date().toISOString(),
  level: LOG_LEVEL_NAMES[level],
  message,
  module,
  metadata,
  error: error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    : undefined,
});

// 基础日志记录函数
const log = (
  level: LogLevel,
  message: string,
  module?: string,
  metadata?: Record<string, unknown>,
  error?: Error,
): void => {
  // 检查日志级别
  if (level < currentLogLevel) {
    return;
  }

  const entry = createLogEntry(level, message, module, metadata, error);
  const formatted = formatLogEntry(entry);

  outputLog(level, formatted);

  // 在生产环境中，可以在这里添加日志持久化逻辑
  if (process.env.NODE_ENV === "production" && level >= LogLevel.ERROR) {
    // 这里可以集成外部日志服务，如ELK Stack、Datadog等
    persistLog(entry);
  }
};

// 日志持久化函数（占位符）
const persistLog = async (entry: LogEntry): Promise<void> => {
  // 在实际应用中，这里可以：
  // 1. 发送到日志聚合服务（如Elasticsearch）
  // 2. 写入文件系统
  // 3. 发送到远程日志服务
  // 4. 存储到数据库

  // 目前只在开发环境记录到控制台
  if (isDevelopment) {
    console.debug("📝 Log persisted:", entry);
  }
};

// 主要的日志接口
export const logger = {
  debug: (message: string, metadata?: Record<string, unknown> | unknown) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    log(LogLevel.DEBUG, message, undefined, safeMetadata);
  },

  info: (message: string, metadata?: Record<string, unknown> | unknown) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    log(LogLevel.INFO, message, undefined, safeMetadata);
  },

  warn: (
    message: string,
    metadata?: Record<string, unknown> | unknown,
    error?: Error | unknown,
  ) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    const safeError = error instanceof Error ? error : undefined;
    log(LogLevel.WARN, message, undefined, safeMetadata, safeError);
  },

  error: (
    message: string,
    metadata?: Record<string, unknown> | unknown,
    error?: Error | unknown,
  ) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    const safeError = error instanceof Error ? error : undefined;
    log(LogLevel.ERROR, message, undefined, safeMetadata, safeError);
  },

  fatal: (
    message: string,
    metadata?: Record<string, unknown> | unknown,
    error?: Error | unknown,
  ) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    const safeError = error instanceof Error ? error : undefined;
    log(LogLevel.FATAL, message, undefined, safeMetadata, safeError);
  },
};

// 带模块前缀的日志记录器工厂
export const createLogger = (module: string) => ({
  debug: (message: string, metadata?: Record<string, unknown> | unknown) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    log(LogLevel.DEBUG, message, module, safeMetadata);
  },

  info: (message: string, metadata?: Record<string, unknown> | unknown) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    log(LogLevel.INFO, message, module, safeMetadata);
  },

  warn: (
    message: string,
    metadata?: Record<string, unknown> | unknown,
    error?: Error | unknown,
  ) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    const safeError = error instanceof Error ? error : undefined;
    log(LogLevel.WARN, message, module, safeMetadata, safeError);
  },

  error: (
    message: string,
    metadata?: Record<string, unknown> | unknown,
    error?: Error | unknown,
  ) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    const safeError = error instanceof Error ? error : undefined;
    log(LogLevel.ERROR, message, module, safeMetadata, safeError);
  },

  fatal: (
    message: string,
    metadata?: Record<string, unknown> | unknown,
    error?: Error | unknown,
  ) => {
    const safeMetadata =
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : { data: metadata };
    const safeError = error instanceof Error ? error : undefined;
    log(LogLevel.FATAL, message, module, safeMetadata, safeError);
  },
});

// 性能监控日志
export const performanceLogger = {
  time: (label: string): void => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label: string): void => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },

  measure: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      logger.debug(`Performance: ${label}`, {
        duration: `${duration.toFixed(2)}ms`,
        status: "success",
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      logger.warn(
        `Performance: ${label}`,
        {
          duration: `${duration.toFixed(2)}ms`,
          status: "error",
        },
        error as Error,
      );

      throw error;
    }
  },
};

// 上下文日志记录器（用于追踪请求）
export class ContextLogger {
  private context: Record<string, unknown>;
  private module?: string;

  constructor(module?: string, initialContext: Record<string, unknown> = {}) {
    this.module = module;
    this.context = { ...initialContext };
  }

  setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  addContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    log(LogLevel.DEBUG, message, this.module, { ...this.context, ...metadata });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    log(LogLevel.INFO, message, this.module, { ...this.context, ...metadata });
  }

  warn(
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error,
  ): void {
    log(
      LogLevel.WARN,
      message,
      this.module,
      { ...this.context, ...metadata },
      error,
    );
  }

  error(
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error,
  ): void {
    log(
      LogLevel.ERROR,
      message,
      this.module,
      { ...this.context, ...metadata },
      error,
    );
  }

  fatal(
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error,
  ): void {
    log(
      LogLevel.FATAL,
      message,
      this.module,
      { ...this.context, ...metadata },
      error,
    );
  }
}

// LogLevel 和 LogEntry 已经在上面导出了，无需重复导出
