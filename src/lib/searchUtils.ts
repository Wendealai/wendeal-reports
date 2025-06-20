import { Report, SearchFilters, SortOptions } from '@/types';

/**
 * 搜索和过滤报告
 */
export function searchAndFilterReports(
  reports: Report[],
  query: string,
  filters: SearchFilters
): Report[] {
  return reports.filter(report => {
    // 文本搜索
    if (query.trim()) {
      const searchText = query.toLowerCase();
      const matchesTitle = report.title.toLowerCase().includes(searchText);
      const matchesDescription = report.description?.toLowerCase().includes(searchText) || false;
      const matchesTags = report.tags.some(tag => tag.toLowerCase().includes(searchText));
      
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // 分类过滤
    if (filters.category && report.category !== filters.category) {
      return false;
    }

    // 阅读状态过滤
    if (filters.readStatus && report.readStatus !== filters.readStatus) {
      return false;
    }

    // 收藏过滤
    if (filters.favoriteOnly && !report.isFavorite) {
      return false;
    }

    // 标签过滤
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => report.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // 日期范围过滤
    if (filters.dateRange) {
      const reportDate = new Date(report.createdAt);
      if (reportDate < filters.dateRange.start || reportDate > filters.dateRange.end) {
        return false;
      }
    }

    // 字数范围过滤
    if (filters.wordCountRange && report.wordCount) {
      if (report.wordCount < filters.wordCountRange.min || report.wordCount > filters.wordCountRange.max) {
        return false;
      }
    }

    // 文件大小范围过滤
    if (filters.fileSizeRange && report.fileSize) {
      if (report.fileSize < filters.fileSizeRange.min || report.fileSize > filters.fileSizeRange.max) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 排序报告
 */
export function sortReports(reports: Report[], sortOptions: SortOptions): Report[] {
  return [...reports].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortOptions.field) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      case 'wordCount':
        aValue = a.wordCount || 0;
        bValue = b.wordCount || 0;
        break;
      case 'fileSize':
        aValue = a.fileSize || 0;
        bValue = b.fileSize || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortOptions.order === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOptions.order === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * 执行完整的搜索、过滤和排序
 */
export function processReports(
  reports: Report[],
  query: string,
  filters: SearchFilters,
  sortOptions: SortOptions
): Report[] {
  // 1. 先进行搜索和过滤
  const filteredReports = searchAndFilterReports(reports, query, filters);
  
  // 2. 然后排序
  const sortedReports = sortReports(filteredReports, sortOptions);
  
  return sortedReports;
}

/**
 * 获取搜索建议
 */
export function getSearchSuggestions(
  reports: Report[],
  query: string,
  limit = 5
): Array<{ type: string; value: string; label: string }> {
  if (!query.trim()) return [];

  const suggestions: Array<{ type: string; value: string; label: string }> = [];
  const queryLower = query.toLowerCase();

  // 标题建议
  reports.forEach(report => {
    if (report.title.toLowerCase().includes(queryLower) && 
        !suggestions.find(s => s.value === report.title)) {
      suggestions.push({
        type: 'title',
        value: report.title,
        label: `标题: ${report.title}`,
      });
    }
  });

  // 标签建议
  const allTags = Array.from(new Set(reports.flatMap(r => r.tags)));
  allTags.forEach(tag => {
    if (tag.toLowerCase().includes(queryLower) && 
        !suggestions.find(s => s.value === tag)) {
      suggestions.push({
        type: 'tag',
        value: tag,
        label: `标签: ${tag}`,
      });
    }
  });

  // 描述建议
  reports.forEach(report => {
    if (report.description && 
        report.description.toLowerCase().includes(queryLower) &&
        !suggestions.find(s => s.value === report.description)) {
      const excerpt = report.description.length > 50 
        ? report.description.substring(0, 50) + '...'
        : report.description;
      suggestions.push({
        type: 'description',
        value: report.description,
        label: `描述: ${excerpt}`,
      });
    }
  });

  return suggestions.slice(0, limit);
}

/**
 * 高亮搜索关键词
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

/**
 * 获取过滤器摘要文本
 */
export function getFilterSummary(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.category) {
    parts.push(`分类: ${filters.category}`);
  }

  if (filters.readStatus) {
    const statusLabels = {
      unread: '未读',
      reading: '阅读中',
      completed: '已读'
    };
    parts.push(`状态: ${statusLabels[filters.readStatus]}`);
  }

  if (filters.favoriteOnly) {
    parts.push('仅收藏');
  }

  if (filters.tags && filters.tags.length > 0) {
    parts.push(`标签: ${filters.tags.join(', ')}`);
  }

  if (filters.dateRange) {
    const start = filters.dateRange.start.toLocaleDateString();
    const end = filters.dateRange.end.toLocaleDateString();
    parts.push(`日期: ${start} - ${end}`);
  }

  if (filters.wordCountRange) {
    parts.push(`字数: ${filters.wordCountRange.min} - ${filters.wordCountRange.max}`);
  }

  if (filters.fileSizeRange) {
    const minMB = (filters.fileSizeRange.min / 1024 / 1024).toFixed(1);
    const maxMB = (filters.fileSizeRange.max / 1024 / 1024).toFixed(1);
    parts.push(`大小: ${minMB}MB - ${maxMB}MB`);
  }

  return parts.join(' | ');
} 