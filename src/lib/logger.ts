// 统一的日志系统
// 在开发环境下输出日志，生产环境下静默

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// 带前缀的日志记录器
export const createLogger = (prefix: string) => ({
  log: (...args: any[]) => logger.log(`[${prefix}]`, ...args),
  error: (...args: any[]) => logger.error(`[${prefix}]`, ...args),
  warn: (...args: any[]) => logger.warn(`[${prefix}]`, ...args),
  info: (...args: any[]) => logger.info(`[${prefix}]`, ...args),
  debug: (...args: any[]) => logger.debug(`[${prefix}]`, ...args),
}); 