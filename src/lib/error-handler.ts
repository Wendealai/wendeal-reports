import { createLogger } from "./logger";

const logger = createLogger("ErrorHandler");

// 自定义错误类型
export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);

    // 恢复原型链
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // 捕获堆栈跟踪
    Error.captureStackTrace(this);
  }
}

// 常见错误类型
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      `Validation Error: ${message}${field ? ` (field: ${field})` : ""}`,
      400,
    );
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ""} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`Database Error: ${message}`, 500);
    this.name = "DatabaseError";
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

// 集中化错误处理器
class ErrorHandler {
  public async handleError(error: Error): Promise<void> {
    await this.logError(error);
    await this.sendCriticalAlert(error);
    await this.saveErrorToDatabase(error);
  }

  public isTrustedError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  private async logError(error: Error): Promise<void> {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...(error instanceof AppError && {
        statusCode: error.statusCode,
        isOperational: error.isOperational,
      }),
    };

    logger.error("🚨 Application Error:", errorInfo);
  }

  private async sendCriticalAlert(error: Error): Promise<void> {
    // 只有非操作性错误才发送警报
    if (!this.isTrustedError(error)) {
      // 这里可以集成邮件、Slack、或其他警报系统
      logger.error("🚨 CRITICAL ERROR - Admin notification needed:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async saveErrorToDatabase(error: Error): Promise<void> {
    // 这里可以将错误保存到数据库用于后续分析
    // 暂时使用日志记录
    if (process.env.NODE_ENV === "production") {
      logger.debug("Error logged for database storage:", {
        type: error.constructor.name,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const errorHandler = new ErrorHandler();

// 创建错误工厂函数
export const createError = {
  validation: (message: string, field?: string) =>
    new ValidationError(message, field),
  notFound: (resource: string, id?: string) => new NotFoundError(resource, id),
  database: (message: string, originalError?: Error) =>
    new DatabaseError(message, originalError),
  authentication: (message?: string) => new AuthenticationError(message),
  authorization: (message?: string) => new AuthorizationError(message),
  general: (message: string, statusCode?: number, isOperational?: boolean) =>
    new AppError(message, statusCode, isOperational),
};

// Express错误处理中间件类型
export interface ErrorMiddleware {
  (error: Error, req: any, res: any, next: any): void;
}

// 用于Next.js API路由的错误处理
export const handleApiError = (error: Error) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        ...(isProduction
          ? {}
          : {
              stack: error.stack,
              timestamp: error.timestamp,
            }),
      },
    };
  }

  // 非操作性错误 - 不暴露详细信息到客户端
  errorHandler.handleError(error);

  return {
    status: 500,
    body: {
      error: isProduction ? "Internal Server Error" : error.message,
      ...(isProduction ? {} : { stack: error.stack }),
    },
  };
};

// 全局Promise错误处理（用于服务器端）
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    logger.error("🚨 Unhandled Promise Rejection:", { reason, promise });
    // 重新抛出以便uncaughtException处理器处理
    throw reason;
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error("🚨 Uncaught Exception:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    errorHandler.handleError(error);

    if (!errorHandler.isTrustedError(error)) {
      logger.error("💥 Process exiting due to untrusted error");
      process.exit(1);
    }
  });
}
