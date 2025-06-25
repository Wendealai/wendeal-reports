"use client";

import React, { useState, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { SearchFilters } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, Filter, Star, BookOpen, X, History } from "lucide-react";

interface AdvancedSearchBarProps {
  onSearch?: (query: string, filters: SearchFilters) => void;
  className?: string;
}

export function AdvancedSearchBar({
  onSearch,
  className,
}: AdvancedSearchBarProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchFilters,
    setSearchFilters,
    searchHistory,
    addToSearchHistory,
    reports,
  } = useAppStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const trimmedQuery = localQuery.trim();
    setSearchQuery(trimmedQuery);

    if (trimmedQuery || Object.keys(searchFilters).length > 0) {
      const resultCount = getFilteredReports(
        trimmedQuery,
        searchFilters,
      ).length;
      addToSearchHistory(trimmedQuery, searchFilters, resultCount);
    }

    onSearch?.(trimmedQuery, searchFilters);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getFilteredReports = (query: string, filters: SearchFilters) => {
    return reports.filter((report) => {
      // 文本搜索
      if (query) {
        const searchText = query.toLowerCase();
        const matchesTitle = report.title.toLowerCase().includes(searchText);
        const matchesDescription =
          report.description?.toLowerCase().includes(searchText) || false;
        const matchesTags = report.tags.some((tag) =>
          tag.toLowerCase().includes(searchText),
        );

        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // 过滤器
      if (filters.category && report.category !== filters.category) {
        return false;
      }

      if (filters.readStatus && report.readStatus !== filters.readStatus) {
        return false;
      }

      if (filters.favoriteOnly && !report.isFavorite) {
        return false;
      }

      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) =>
          report.tags.includes(tag),
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      if (filters.dateRange) {
        const reportDate = new Date(report.createdAt);
        if (
          reportDate < filters.dateRange.start ||
          reportDate > filters.dateRange.end
        ) {
          return false;
        }
      }

      if (filters.wordCountRange && report.wordCount) {
        if (
          report.wordCount < filters.wordCountRange.min ||
          report.wordCount > filters.wordCountRange.max
        ) {
          return false;
        }
      }

      if (filters.fileSizeRange && report.fileSize) {
        if (
          report.fileSize < filters.fileSizeRange.min ||
          report.fileSize > filters.fileSizeRange.max
        ) {
          return false;
        }
      }

      return true;
    });
  };

  // 获取搜索建议
  const getSearchSuggestions = () => {
    if (!localQuery) return [];

    const suggestions: Array<{ type: string; value: string; label: string }> =
      [];
    const queryLower = localQuery.toLowerCase();

    // 标题建议
    reports.forEach((report) => {
      if (report.title.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: "title",
          value: report.title,
          label: `标题: ${report.title}`,
        });
      }
    });

    // 标签建议
    const allTags = Array.from(new Set(reports.flatMap((r) => r.tags)));
    allTags.forEach((tag) => {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: "tag",
          value: tag,
          label: `标签: ${tag}`,
        });
      }
    });

    return suggestions.slice(0, 5);
  };

  const suggestions = getSearchSuggestions();

  const clearFilter = (filterKey: keyof SearchFilters) => {
    const newFilters = { ...searchFilters };
    delete newFilters[filterKey];
    setSearchFilters(newFilters);
  };

  const addQuickFilter = (filterKey: keyof SearchFilters, value: unknown) => {
    const newFilters = { ...searchFilters, [filterKey]: value };
    setSearchFilters(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(searchFilters).length;
  };

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      {/* 主搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="搜索报告标题、描述、标签..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-20"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* 高级过滤按钮 */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 relative"
              >
                <Filter className="h-4 w-4" />
                {getActiveFiltersCount() > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                  >
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">高级过滤</h4>

                {/* 快速过滤按钮 */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">快速过滤</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={
                        searchFilters.favoriteOnly ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        searchFilters.favoriteOnly
                          ? clearFilter("favoriteOnly")
                          : addQuickFilter("favoriteOnly", true)
                      }
                    >
                      <Star className="h-3 w-3 mr-1" />
                      收藏
                    </Button>

                    <Button
                      variant={
                        searchFilters.readStatus === "unread"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        searchFilters.readStatus === "unread"
                          ? clearFilter("readStatus")
                          : addQuickFilter("readStatus", "unread")
                      }
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      未读
                    </Button>

                    <Button
                      variant={
                        searchFilters.readStatus === "completed"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        searchFilters.readStatus === "completed"
                          ? clearFilter("readStatus")
                          : addQuickFilter("readStatus", "completed")
                      }
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      已读
                    </Button>
                  </div>
                </div>

                {/* 活跃过滤器显示 */}
                {getActiveFiltersCount() > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">当前过滤器</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(searchFilters).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="gap-1">
                          {key}: {String(value)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() =>
                              clearFilter(key as keyof SearchFilters)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* 搜索按钮 */}
          <Button size="sm" onClick={handleSearch} className="h-8">
            搜索
          </Button>
        </div>
      </div>

      {/* 搜索建议下拉 */}
      {showSuggestions &&
        (suggestions.length > 0 || searchHistory.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
            <Command>
              <CommandList>
                {/* 搜索建议 */}
                {suggestions.length > 0 && (
                  <CommandGroup heading="搜索建议">
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => {
                          setLocalQuery(suggestion.value);
                          setShowSuggestions(false);
                          if (inputRef.current) {
                            inputRef.current.focus();
                          }
                        }}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {suggestion.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* 搜索历史 */}
                {searchHistory.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="搜索历史">
                      {searchHistory.slice(0, 5).map((historyItem) => (
                        <CommandItem
                          key={historyItem.id}
                          onSelect={() => {
                            setLocalQuery(historyItem.query);
                            setSearchFilters(historyItem.filters);
                            setShowSuggestions(false);
                            if (inputRef.current) {
                              inputRef.current.focus();
                            }
                          }}
                        >
                          <History className="h-4 w-4 mr-2" />
                          <div className="flex-1">
                            <div>{historyItem.query || "空查询"}</div>
                            <div className="text-xs text-muted-foreground">
                              {historyItem.resultCount} 个结果
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(
                              historyItem.timestamp,
                            ).toLocaleDateString()}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        )}

      {/* 点击外部关闭建议 */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}
