import { prisma } from './prisma';

export interface QueryPerformanceMetrics {
  queryTime: number;
  resultCount: number;
  cacheHit?: boolean;
  optimizationSuggestions?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
  enabled?: boolean;
}

// Simple in-memory cache for development
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();
  
  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

const cache = new SimpleCache();

/**
 * Measure query performance
 */
export async function measureQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string = 'unknown'
): Promise<{ result: T; metrics: QueryPerformanceMetrics }> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const queryTime = Date.now() - startTime;
    
    const resultCount = Array.isArray(result) ? result.length : 1;
    
    const metrics: QueryPerformanceMetrics = {
      queryTime,
      resultCount,
      optimizationSuggestions: generateOptimizationSuggestions(queryTime, resultCount)
    };
    
    console.log(`Query "${queryName}" completed in ${queryTime}ms, returned ${resultCount} results`);
    
    return { result, metrics };
  } catch (error) {
    const queryTime = Date.now() - startTime;
    console.error(`Query "${queryName}" failed after ${queryTime}ms:`, error);
    throw error;
  }
}

/**
 * Generate optimization suggestions based on query performance
 */
function generateOptimizationSuggestions(queryTime: number, resultCount: number): string[] {
  const suggestions: string[] = [];
  
  if (queryTime > 1000) {
    suggestions.push('Query took over 1 second - consider adding indexes or optimizing the query');
  }
  
  if (queryTime > 500 && resultCount > 100) {
    suggestions.push('Large result set with slow query - consider pagination or filtering');
  }
  
  if (resultCount > 1000) {
    suggestions.push('Very large result set - implement pagination to improve performance');
  }
  
  if (queryTime > 200 && resultCount < 10) {
    suggestions.push('Slow query with few results - check if proper indexes are in place');
  }
  
  return suggestions;
}

/**
 * Cached query wrapper
 */
export async function cachedQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  options: CacheOptions = {}
): Promise<{ result: T; metrics: QueryPerformanceMetrics }> {
  const { ttl = 300, enabled = true } = options;
  
  if (enabled) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        result: cached,
        metrics: {
          queryTime: 0,
          resultCount: Array.isArray(cached) ? cached.length : 1,
          cacheHit: true
        }
      };
    }
  }
  
  const { result, metrics } = await measureQuery(queryFn, `cached:${cacheKey}`);
  
  if (enabled && metrics.queryTime < 5000) { // Don't cache very slow queries
    cache.set(cacheKey, result, ttl);
  }
  
  return { result, metrics: { ...metrics, cacheHit: false } };
}

/**
 * Optimized report queries
 */
export const optimizedQueries = {
  /**
   * Get reports with optimized includes and pagination
   */
  async getReports(options: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    userId?: string;
    search?: string;
    orderBy?: 'createdAt' | 'updatedAt' | 'title';
    orderDirection?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      categoryId,
      userId,
      search,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const cacheKey = `reports:${JSON.stringify({ ...options, page, limit })}`;
    
    return cachedQuery(
      () => prisma.report.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true }
          },
          files: {
            select: { 
              id: true, 
              filename: true, 
              size: true, 
              isCompressed: true,
              compressionRatio: true 
            }
          },
          _count: {
            select: { reportTags: true }
          }
        },
        orderBy: { [orderBy]: orderDirection },
        skip,
        take: limit
      }),
      cacheKey,
      { ttl: 180 } // 3 minutes cache
    );
  },

  /**
   * Get report by ID with full details
   */
  async getReportById(id: string) {
    const cacheKey = `report:${id}`;
    
    return cachedQuery(
      () => prisma.report.findUnique({
        where: { id },
        include: {
          category: true,
          user: {
            select: { id: true, name: true, email: true }
          },
          files: true,
          reportTags: {
            include: {
              tag: true
            }
          }
        }
      }),
      cacheKey,
      { ttl: 600 } // 10 minutes cache
    );
  },

  /**
   * Get file statistics
   */
  async getFileStats() {
    const cacheKey = 'file-stats';
    
    return cachedQuery(
      async () => {
        const [totalFiles, totalSize, compressedFiles, avgCompressionRatio] = await Promise.all([
          prisma.file.count(),
          prisma.file.aggregate({
            _sum: { size: true }
          }),
          prisma.file.count({
            where: { isCompressed: true }
          }),
          prisma.file.aggregate({
            _avg: { compressionRatio: true },
            where: { isCompressed: true }
          })
        ]);
        
        return {
          totalFiles,
          totalSize: totalSize._sum.size || 0,
          compressedFiles,
          compressionRatio: avgCompressionRatio._avg.compressionRatio || 0,
          compressionPercentage: totalFiles > 0 ? (compressedFiles / totalFiles) * 100 : 0
        };
      },
      cacheKey,
      { ttl: 3600 } // 1 hour cache
    );
  }
};

/**
 * Cache management utilities
 */
export const cacheManager = {
  /**
   * Clear all cache
   */
  clearAll(): void {
    cache.clear();
  },

  /**
   * Clear cache by pattern
   */
  clearByPattern(pattern: string): void {
    const keys = Array.from((cache as any).cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  },

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: cache.size(),
      keys: Array.from((cache as any).cache.keys())
    };
  },

  /**
   * Invalidate report-related cache when reports are modified
   */
  invalidateReportCache(reportId?: string): void {
    this.clearByPattern('reports:');
    if (reportId) {
      cache.delete(`report:${reportId}`);
    }
    cache.delete('file-stats');
  }
};

/**
 * Performance monitoring
 */
export const performanceMonitor = {
  /**
   * Log slow queries
   */
  logSlowQuery(queryName: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms (threshold: ${threshold}ms)`);
    }
  },

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = cacheManager.getStats();
    
    if (stats.size === 0) {
      recommendations.push('Consider enabling caching to improve performance');
    }
    
    if (stats.size > 100) {
      recommendations.push('Cache size is large, consider reducing TTL or implementing cache eviction');
    }
    
    return recommendations;
  }
};
