'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getFilterSummary } from '@/lib/searchUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Search, Filter } from 'lucide-react';

interface SearchResultsInfoProps {
  resultCount: number;
  totalCount: number;
  className?: string;
}

export function SearchResultsInfo({ 
  resultCount, 
  totalCount, 
  className 
}: SearchResultsInfoProps) {
  const { 
    searchQuery, 
    searchFilters, 
    setSearchQuery, 
    setSearchFilters 
  } = useAppStore();

  const hasActiveSearch = searchQuery.trim() || Object.keys(searchFilters).length > 0;
  const filterSummary = getFilterSummary(searchFilters);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchFilters({});
  };

  const clearSearchQuery = () => {
    setSearchQuery('');
  };

  const clearFilters = () => {
    setSearchFilters({});
  };

  if (!hasActiveSearch && resultCount === totalCount) {
    return (
      <div className={`flex items-center justify-between text-sm text-muted-foreground ${className}`}>
        <span>显示全部 {totalCount} 个报告</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 结果统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Search className="h-4 w-4" />
          <span>
            找到 <span className="font-medium text-foreground">{resultCount}</span> 个结果
            {totalCount !== resultCount && (
              <span className="text-muted-foreground"> (共 {totalCount} 个)</span>
            )}
          </span>
        </div>

        {hasActiveSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto p-1 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            清除所有
          </Button>
        )}
      </div>

      {/* 活跃搜索条件 */}
      {hasActiveSearch && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* 搜索关键词 */}
          {searchQuery.trim() && (
            <Badge variant="secondary" className="gap-1">
              <Search className="h-3 w-3" />
                             关键词: &ldquo;{searchQuery}&rdquo;
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={clearSearchQuery}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {/* 过滤器 */}
          {Object.keys(searchFilters).length > 0 && (
            <Badge variant="outline" className="gap-1">
              <Filter className="h-3 w-3" />
              {filterSummary}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={clearFilters}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* 无结果提示 */}
      {hasActiveSearch && resultCount === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">未找到符合条件的报告</p>
            <p className="text-xs mt-1">尝试调整搜索关键词或过滤条件</p>
          </div>
        </div>
      )}
    </div>
  );
} 