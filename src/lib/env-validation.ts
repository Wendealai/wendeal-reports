/**
 * 环境变量验证工具
 * 确保必要的环境变量在应用启动时已正确设置
 */

import { createLogger } from './logger';

const logger = createLogger('EnvValidation');

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 必需的环境变量
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
] as const;

/**
 * 推荐的环境变量（在生产环境中应该设置）
 */
const RECOMMENDED_ENV_VARS = [
  'NEXTAUTH_URL',
  'DEFAULT_USER_ID',
] as const;

/**
 * 验证单个环境变量
 */
function validateEnvVar(name: string, required: boolean = true): string | null {
  const value = process.env[name];
  
  if (!value) {
    return required ? `缺少必需的环境变量: ${name}` : `建议设置环境变量: ${name}`;
  }
  
  // 特定验证规则
  switch (name) {
    case 'DATABASE_URL':
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        return `${name} 必须是有效的 PostgreSQL 连接字符串`;
      }
      if (value.includes('username:password') || value.includes('ep-xxx-xxx')) {
        return `${name} 包含占位符值，请配置实际的数据库连接`;
      }
      break;
      
    case 'NEXTAUTH_SECRET':
      if (value.length < 32) {
        return `${name} 长度应至少为32个字符以确保安全性`;
      }
      if (value === 'your-super-secret-key-change-in-production-please') {
        return `${name} 使用默认值，请在生产环境中更改`;
      }
      break;
      
    case 'NEXTAUTH_URL':
      try {
        new URL(value);
      } catch {
        return `${name} 必须是有效的URL`;
      }
      break;
      
    case 'DEFAULT_USER_ID':
      if (value.length < 10) {
        return `${name} 长度太短，应为有效的用户ID`;
      }
      break;
  }
  
  return null;
}

/**
 * 验证所有环境变量
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  logger.info('开始环境变量验证...');
  
  // 验证必需的环境变量
  for (const envVar of REQUIRED_ENV_VARS) {
    const error = validateEnvVar(envVar, true);
    if (error) {
      errors.push(error);
    }
  }
  
  // 验证推荐的环境变量
  for (const envVar of RECOMMENDED_ENV_VARS) {
    const warning = validateEnvVar(envVar, false);
    if (warning) {
      warnings.push(warning);
    }
  }
  
  // 环境特定检查
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    // 生产环境额外检查
    if (process.env.NEXTAUTH_SECRET === 'your-super-secret-key-change-in-production-please') {
      errors.push('生产环境必须更改默认的 NEXTAUTH_SECRET');
    }
    
    if (process.env.DATABASE_URL?.includes('localhost')) {
      warnings.push('生产环境使用 localhost 数据库连接，请确认这是预期的');
    }
  }
  
  const isValid = errors.length === 0;
  
  if (errors.length > 0) {
    logger.error('环境变量验证失败:', errors);
  }
  
  if (warnings.length > 0) {
    logger.warn('环境变量警告:', warnings);
  }
  
  if (isValid) {
    logger.info('环境变量验证通过');
  }
  
  return {
    isValid,
    errors,
    warnings
  };
}

/**
 * 获取安全的环境变量信息（用于调试）
 */
export function getSafeEnvInfo() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOSTNAME: process.env.HOSTNAME,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DEFAULT_USER_ID_SET: !!process.env.DEFAULT_USER_ID,
  };
}

/**
 * 在应用启动时验证环境变量
 */
export function validateOnStartup(): void {
  const result = validateEnvironmentVariables();
  
  if (!result.isValid) {
    logger.error('应用启动失败：环境变量验证不通过');
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`环境变量验证失败: ${result.errors.join(', ')}`);
    }
  }
  
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => logger.warn(warning));
  }
}
