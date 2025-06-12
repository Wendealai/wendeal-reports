// 报告相关类型定义
export interface Report {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  content?: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  readStatus: 'unread' | 'reading' | 'completed';
  fileSize?: number;
  wordCount?: number;
}

// 分类相关类型定义
export interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
  reportCount: number;
  icon?: string;
  description?: string;
  color?: string;
}

// 搜索相关类型定义
export interface SearchFilters {
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  readStatus?: Report['readStatus'];
  favoriteOnly?: boolean;
  fileSizeRange?: {
    min: number;
    max: number;
  };
  wordCountRange?: {
    min: number;
    max: number;
  };
}

export interface SearchResult {
  reports: Report[];
  totalCount: number;
  query: string;
  filters: SearchFilters;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: Date;
  lastUsed?: Date;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
  resultCount: number;
}

export type SortField = 'title' | 'createdAt' | 'updatedAt' | 'wordCount' | 'fileSize';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

// UI状态管理类型定义
export interface AppState {
  // 侧边栏状态
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 当前选中的报告和分类
  selectedReport: Report | null;
  setSelectedReport: (report: Report | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  
  // 搜索状态
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  sortOptions: SortOptions;
  setSortOptions: (options: SortOptions) => void;
  searchHistory: SearchHistory[];
  addToSearchHistory: (query: string, filters: SearchFilters, resultCount: number) => void;
  clearSearchHistory: () => void;
  savedSearches: SavedSearch[];
  saveSearch: (name: string, query: string, filters: SearchFilters) => void;
  deleteSavedSearch: (searchId: string) => void;
  
  // 主题
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // 批量选择状态
  selectedReports: string[];
  setSelectedReports: (reportIds: string[]) => void;
  batchMode: boolean;
  setBatchMode: (enabled: boolean) => void;
  
  // 数据
  reports: Report[];
  categories: Category[];
  setReports: (reports: Report[]) => void;
  setCategories: (categories: Category[]) => void;
  addReport: (report: Report) => void;
  
  // 报告编辑功能
  updateReport: (reportId: string, updates: Partial<Report>) => void;
  deleteReport: (reportId: string) => void;
  deleteReports: (reportIds: string[]) => void;
  toggleFavorite: (reportId: string) => void;
  updateReportsStatus: (reportIds: string[], status: Report['readStatus']) => void;
  updateReportsCategory: (reportIds: string[], categoryId: string) => void;
  toggleReportsFavorite: (reportIds: string[], favorite: boolean) => void;
  replaceReportFile: (reportId: string, newFilePath: string, fileSize?: number, wordCount?: number) => void;
  
  // 编辑功能（原有的保持兼容）
  updateCategoryName: (categoryId: string, newName: string) => void;
  updateReportTitle: (reportId: string, newTitle: string) => void;
} 