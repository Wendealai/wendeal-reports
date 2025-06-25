/**
 * 简化版文件优化 - 用于构建时避免依赖问题
 */

export interface OptimizationResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  optimizedContent: string;
  isCompressed: boolean;
}

export interface OptimizationOptions {
  enableCompression?: boolean;
  compressionLevel?: number;
  minSizeForCompression?: number;
  enableHtmlMinification?: boolean;
  removeComments?: boolean;
  removeWhitespace?: boolean;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
  enableCompression: false, // 构建时禁用压缩
  compressionLevel: 6,
  minSizeForCompression: 1024,
  enableHtmlMinification: true,
  removeComments: true,
  removeWhitespace: true,
};

/**
 * 简单的HTML压缩 - 不依赖外部库
 */
export function minifyHtml(
  html: string,
  options: OptimizationOptions = {},
): string {
  let minified = html;

  if (options.removeComments !== false) {
    // 移除HTML注释但保留条件注释
    minified = minified.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");
  }

  if (options.removeWhitespace !== false) {
    // 移除多余的空白字符
    minified = minified
      .replace(/\s+/g, " ") // 多个空格替换为单个空格
      .replace(/>\s+</g, "><") // 移除标签间的空格
      .replace(/^\s+|\s+$/gm, "") // 移除行首行尾空格
      .trim();
  }

  return minified;
}

/**
 * 基础的HTML清理和优化
 */
export function sanitizeAndOptimizeHtml(
  html: string,
  options: OptimizationOptions = {},
): string {
  // 基础的HTML清理（不使用DOMPurify）
  let sanitized = html;

  // 移除潜在的危险脚本标签
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // 移除事件处理器属性
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // 清理javascript: 协议
  sanitized = sanitized.replace(/javascript:/gi, "");

  // 如果启用了HTML压缩
  if (options.enableHtmlMinification !== false) {
    return minifyHtml(sanitized, options);
  }

  return sanitized;
}

/**
 * 简化版文件内容优化
 */
export function optimizeFileContent(
  content: string,
  options: OptimizationOptions = {},
): OptimizationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = new TextEncoder().encode(content).length;

  // 只进行HTML清理和压缩，不使用gzip压缩
  const optimizedContent = sanitizeAndOptimizeHtml(content, opts);
  const optimizedSize = new TextEncoder().encode(optimizedContent).length;

  const compressionRatio =
    originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

  return {
    originalSize,
    compressedSize: optimizedSize,
    compressionRatio,
    optimizedContent,
    isCompressed: false, // 构建时不使用压缩
  };
}

/**
 * 格式化字节数为可读字符串
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * 格式化压缩比为百分比
 */
export function formatCompressionRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/**
 * 计算优化节省
 */
export function calculateOptimizationSavings(
  content: string,
  options: OptimizationOptions = {},
): {
  originalSize: number;
  minifiedSize: number;
  compressedSize: number;
  minificationSavings: number;
  compressionSavings: number;
  totalSavings: number;
} {
  const originalSize = new TextEncoder().encode(content).length;

  // 计算压缩节省
  const minified = sanitizeAndOptimizeHtml(content, options);
  const minifiedSize = new TextEncoder().encode(minified).length;
  const minificationSavings = originalSize - minifiedSize;

  // 构建时不计算gzip压缩
  const compressedSize = minifiedSize;
  const compressionSavings = 0;
  const totalSavings = originalSize - compressedSize;

  return {
    originalSize,
    minifiedSize,
    compressedSize,
    minificationSavings,
    compressionSavings,
    totalSavings,
  };
}
