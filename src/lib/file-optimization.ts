// 动态导入以避免构建时问题
let pako: any;
let DOMPurify: any;

// 在运行时动态加载依赖
async function loadDependencies() {
  if (typeof window !== "undefined" || typeof global !== "undefined") {
    try {
      if (!pako) {
        pako = await import("pako");
      }
      if (!DOMPurify) {
        DOMPurify = await import("isomorphic-dompurify");
        DOMPurify = DOMPurify.default || DOMPurify;
      }
    } catch (error) {
      console.warn("Failed to load optimization dependencies:", error);
    }
  }
}

export interface OptimizationResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  optimizedContent: string;
  isCompressed: boolean;
}

export interface OptimizationOptions {
  enableCompression?: boolean;
  compressionLevel?: number; // 1-9, higher = better compression but slower
  minSizeForCompression?: number; // Only compress files larger than this (bytes)
  enableHtmlMinification?: boolean;
  removeComments?: boolean;
  removeWhitespace?: boolean;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
  enableCompression: true,
  compressionLevel: 6,
  minSizeForCompression: 1024, // 1KB
  enableHtmlMinification: true,
  removeComments: true,
  removeWhitespace: true,
};

/**
 * Minify HTML content by removing unnecessary whitespace and comments
 */
export function minifyHtml(
  html: string,
  options: OptimizationOptions = {},
): string {
  let minified = html;

  if (options.removeComments !== false) {
    // Remove HTML comments but preserve conditional comments
    minified = minified.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");
  }

  if (options.removeWhitespace !== false) {
    // Remove excessive whitespace while preserving structure
    minified = minified
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/>\s+</g, "><") // Remove spaces between tags
      .replace(/^\s+|\s+$/gm, "") // Remove leading/trailing whitespace from lines
      .trim();
  }

  return minified;
}

/**
 * Sanitize and optimize HTML content
 */
export async function sanitizeAndOptimizeHtml(
  html: string,
  options: OptimizationOptions = {},
): Promise<string> {
  await loadDependencies();

  let sanitized = html;

  // Only sanitize if DOMPurify is available
  if (DOMPurify && DOMPurify.sanitize) {
    try {
      sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "html",
          "head",
          "body",
          "title",
          "meta",
          "link",
          "style",
          "script",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "p",
          "div",
          "span",
          "br",
          "hr",
          "strong",
          "em",
          "b",
          "i",
          "u",
          "ul",
          "ol",
          "li",
          "blockquote",
          "pre",
          "code",
          "table",
          "tr",
          "td",
          "th",
          "thead",
          "tbody",
          "tfoot",
          "caption",
          "a",
          "img",
          "figure",
          "figcaption",
          "section",
          "article",
          "header",
          "footer",
          "nav",
          "aside",
          "main",
          "noscript",
          "small",
          "sub",
          "sup",
        ],
        ALLOWED_ATTR: [
          "class",
          "id",
          "style",
          "href",
          "src",
          "alt",
          "title",
          "width",
          "height",
          "colspan",
          "rowspan",
          "target",
          "rel",
          "data-*",
          "type",
          "name",
          "value",
          "charset",
          "content",
          "http-equiv",
          "viewport",
          "lang",
          "dir",
          "tabindex",
          "role",
          "aria-*",
        ],
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
    } catch (error) {
      console.warn(
        "DOMPurify sanitization failed, using original content:",
        error,
      );
      sanitized = html;
    }
  }

  // Then minify if enabled
  if (options.enableHtmlMinification !== false) {
    return minifyHtml(sanitized, options);
  }

  return sanitized;
}

/**
 * Compress content using gzip compression
 */
export async function compressContent(
  content: string,
  compressionLevel: number = 6,
): Promise<Uint8Array | null> {
  await loadDependencies();

  if (!pako || !pako.gzip) {
    console.warn("Pako compression not available");
    return null;
  }

  try {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(content);
    return pako.gzip(data, { level: compressionLevel });
  } catch (error) {
    console.warn("Compression failed:", error);
    return null;
  }
}

/**
 * Decompress gzip-compressed content
 */
export async function decompressContent(
  compressedData: Uint8Array,
): Promise<string | null> {
  await loadDependencies();

  if (!pako || !pako.ungzip) {
    console.warn("Pako decompression not available");
    return null;
  }

  try {
    const decompressed = pako.ungzip(compressedData);
    const textDecoder = new TextDecoder();
    return textDecoder.decode(decompressed);
  } catch (error) {
    console.warn("Decompression failed:", error);
    return null;
  }
}

/**
 * Optimize file content with compression and minification
 */
export async function optimizeFileContent(
  content: string,
  options: OptimizationOptions = {},
): Promise<OptimizationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = new TextEncoder().encode(content).length;

  // Step 1: Sanitize and minify HTML
  const optimizedContent = await sanitizeAndOptimizeHtml(content, opts);
  const optimizedSize = new TextEncoder().encode(optimizedContent).length;

  // Step 2: Determine if compression should be applied
  const shouldCompress =
    opts.enableCompression &&
    optimizedSize >= (opts.minSizeForCompression || 1024);

  let finalContent = optimizedContent;
  let finalSize = optimizedSize;
  let isCompressed = false;

  if (shouldCompress) {
    try {
      const compressed = await compressContent(
        optimizedContent,
        opts.compressionLevel,
      );
      if (compressed) {
        const compressedSize = compressed.length;

        // Only use compression if it actually reduces size significantly
        if (compressedSize < optimizedSize * 0.9) {
          // At least 10% reduction
          finalContent = Buffer.from(compressed).toString("base64");
          finalSize = compressedSize;
          isCompressed = true;
        }
      }
    } catch (error) {
      console.warn("Compression failed, using uncompressed content:", error);
    }
  }

  const compressionRatio =
    originalSize > 0 ? (originalSize - finalSize) / originalSize : 0;

  return {
    originalSize,
    compressedSize: finalSize,
    compressionRatio,
    optimizedContent: finalContent,
    isCompressed,
  };
}

/**
 * Calculate potential savings from optimization
 */
export async function calculateOptimizationSavings(
  content: string,
  options: OptimizationOptions = {},
): Promise<{
  originalSize: number;
  minifiedSize: number;
  compressedSize: number;
  minificationSavings: number;
  compressionSavings: number;
  totalSavings: number;
}> {
  const originalSize = new TextEncoder().encode(content).length;

  // Calculate minification savings
  const minified = await sanitizeAndOptimizeHtml(content, options);
  const minifiedSize = new TextEncoder().encode(minified).length;
  const minificationSavings = originalSize - minifiedSize;

  // Calculate compression savings
  let compressedSize = minifiedSize;
  let compressionSavings = 0;

  try {
    const compressed = await compressContent(
      minified,
      options.compressionLevel || 6,
    );
    if (compressed) {
      compressedSize = compressed.length;
      compressionSavings = minifiedSize - compressedSize;
    }
  } catch (error) {
    console.warn("Could not calculate compression savings:", error);
  }

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

/**
 * Format bytes to human readable string
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
 * Format compression ratio as percentage
 */
export function formatCompressionRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
