export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    detectedMimeType: string;
    actualExtension: string;
    size: number;
    isHtml: boolean;
    hasScripts: boolean;
    hasExternalResources: boolean;
    encoding: string;
  };
  securityChecks: {
    hasMaliciousContent: boolean;
    hasEmbeddedScripts: boolean;
    hasExternalLinks: boolean;
    hasFormElements: boolean;
    suspiciousPatterns: string[];
  };
}

export interface ValidationOptions {
  maxFileSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  checkContent?: boolean;
  strictMode?: boolean;
  allowExternalResources?: boolean;
  allowScripts?: boolean;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ["text/html", "application/xhtml+xml"],
  allowedExtensions: [".html", ".htm", ".xhtml"],
  checkContent: true,
  strictMode: true,
  allowExternalResources: false,
  allowScripts: false,
};

// Suspicious patterns that might indicate malicious content
const SUSPICIOUS_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /data:application\/javascript/gi,
  /<script[^>]*>/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<form[^>]*>/gi,
  /onclick\s*=/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onmouseover\s*=/gi,
  /eval\s*\(/gi,
  /document\.write/gi,
  /window\.location/gi,
  /document\.cookie/gi,
];

/**
 * Detect MIME type from file content
 */
export function detectMimeType(content: Buffer | string): string {
  const buffer = typeof content === "string" ? Buffer.from(content) : content;
  const header = buffer
    .toString("utf8", 0, Math.min(512, buffer.length))
    .toLowerCase();

  // Check for HTML signatures
  if (
    header.includes("<!doctype html") ||
    header.includes("<html") ||
    header.includes("<head>") ||
    header.includes("<body>")
  ) {
    return "text/html";
  }

  // Check for XHTML
  if (header.includes("<?xml") && header.includes("xhtml")) {
    return "application/xhtml+xml";
  }

  // Check for XML
  if (header.includes("<?xml")) {
    return "application/xml";
  }

  return "text/plain";
}

/**
 * Detect file encoding
 */
export function detectEncoding(buffer: Buffer): string {
  // Check for BOM
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return "utf-8-bom";
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return "utf-16le";
  }

  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return "utf-16be";
  }

  // Try to decode as UTF-8
  try {
    const decoded = buffer.toString("utf8");
    // Check if it contains replacement characters (indicates invalid UTF-8)
    if (!decoded.includes("\uFFFD")) {
      return "utf-8";
    }
  } catch (e) {
    // Fall through to other encodings
  }

  return "unknown";
}

/**
 * Analyze HTML content for security issues
 */
export function analyzeHtmlContent(content: string): {
  hasScripts: boolean;
  hasExternalResources: boolean;
  hasFormElements: boolean;
  suspiciousPatterns: string[];
  externalDomains: string[];
} {
  const suspiciousPatterns: string[] = [];
  const externalDomains: string[] = [];

  // Check for suspicious patterns
  SUSPICIOUS_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      suspiciousPatterns.push(...matches);
    }
  });

  // Check for external resources
  const urlPattern = /(?:src|href|action)\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi;
  let match;
  while ((match = urlPattern.exec(content)) !== null) {
    try {
      const url = new URL(match[1]);
      if (!externalDomains.includes(url.hostname)) {
        externalDomains.push(url.hostname);
      }
    } catch (e) {
      // Invalid URL, ignore
    }
  }

  return {
    hasScripts: /<script[^>]*>/i.test(content) || /javascript:/i.test(content),
    hasExternalResources: externalDomains.length > 0,
    hasFormElements: /<form[^>]*>/i.test(content),
    suspiciousPatterns: [...new Set(suspiciousPatterns)], // Remove duplicates
    externalDomains,
  };
}

/**
 * Validate file extension
 */
export function validateExtension(
  filename: string,
  allowedExtensions: string[],
): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return allowedExtensions.some((ext) => ext.toLowerCase() === extension);
}

/**
 * Validate MIME type
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[],
): boolean {
  return allowedTypes.some((type) => {
    if (type.includes("*")) {
      const baseType = type.split("/")[0];
      return mimeType.startsWith(baseType + "/");
    }
    return mimeType === type;
  });
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  file: File | { name: string; size: number; type: string },
  content: Buffer | string,
  options: ValidationOptions = {},
): FileValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic file info
  const buffer = typeof content === "string" ? Buffer.from(content) : content;
  const contentString = buffer.toString("utf8");
  const detectedMimeType = detectMimeType(buffer);
  const encoding = detectEncoding(buffer);

  // File size validation
  if (file.size > opts.maxFileSize!) {
    errors.push(
      `文件大小 ${(file.size / 1024 / 1024).toFixed(2)}MB 超过限制 ${(opts.maxFileSize! / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  // Extension validation
  if (!validateExtension(file.name, opts.allowedExtensions!)) {
    errors.push(
      `不支持的文件扩展名。支持的格式: ${opts.allowedExtensions!.join(", ")}`,
    );
  }

  // MIME type validation
  const declaredMimeType = file.type || detectedMimeType;
  if (!validateMimeType(declaredMimeType, opts.allowedMimeTypes!)) {
    errors.push(
      `不支持的文件类型: ${declaredMimeType}。支持的类型: ${opts.allowedMimeTypes!.join(", ")}`,
    );
  }

  // MIME type vs detected type mismatch
  if (file.type && file.type !== detectedMimeType) {
    warnings.push(
      `声明的MIME类型 (${file.type}) 与检测到的类型 (${detectedMimeType}) 不匹配`,
    );
  }

  // Content analysis
  let contentAnalysis = {
    hasScripts: false,
    hasExternalResources: false,
    hasFormElements: false,
    suspiciousPatterns: [] as string[],
    externalDomains: [] as string[],
  };

  if (opts.checkContent) {
    contentAnalysis = analyzeHtmlContent(contentString);

    // Security checks
    if (!opts.allowScripts && contentAnalysis.hasScripts) {
      if (opts.strictMode) {
        errors.push("文件包含脚本内容，不允许上传");
      } else {
        warnings.push("文件包含脚本内容，将在处理时移除");
      }
    }

    if (!opts.allowExternalResources && contentAnalysis.hasExternalResources) {
      if (opts.strictMode) {
        errors.push(
          `文件包含外部资源链接: ${contentAnalysis.externalDomains.join(", ")}`,
        );
      } else {
        warnings.push(
          `文件包含外部资源链接，可能影响显示效果: ${contentAnalysis.externalDomains.join(", ")}`,
        );
      }
    }

    if (contentAnalysis.suspiciousPatterns.length > 0) {
      if (opts.strictMode) {
        errors.push(
          `检测到可疑内容模式: ${contentAnalysis.suspiciousPatterns.slice(0, 3).join(", ")}${contentAnalysis.suspiciousPatterns.length > 3 ? "..." : ""}`,
        );
      } else {
        warnings.push(
          `检测到可疑内容模式: ${contentAnalysis.suspiciousPatterns.slice(0, 3).join(", ")}${contentAnalysis.suspiciousPatterns.length > 3 ? "..." : ""}`,
        );
      }
    }
  }

  // Encoding validation
  if (encoding === "unknown") {
    warnings.push("无法确定文件编码，可能导致显示问题");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      detectedMimeType,
      actualExtension: file.name.substring(file.name.lastIndexOf(".")),
      size: file.size,
      isHtml: detectedMimeType.includes("html"),
      hasScripts: contentAnalysis.hasScripts,
      hasExternalResources: contentAnalysis.hasExternalResources,
      encoding,
    },
    securityChecks: {
      hasMaliciousContent: contentAnalysis.suspiciousPatterns.length > 0,
      hasEmbeddedScripts: contentAnalysis.hasScripts,
      hasExternalLinks: contentAnalysis.hasExternalResources,
      hasFormElements: contentAnalysis.hasFormElements,
      suspiciousPatterns: contentAnalysis.suspiciousPatterns,
    },
  };
}
