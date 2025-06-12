// 报告相关类型定义
export interface Report {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
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
}

export interface SearchResult {
  reports: Report[];
  totalCount: number;
  query: string;
  filters: SearchFilters;
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
  
  // 主题
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // 数据
  reports: Report[];
  categories: Category[];
  setReports: (reports: Report[]) => void;
  setCategories: (categories: Category[]) => void;
} 