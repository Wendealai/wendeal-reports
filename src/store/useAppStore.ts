import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, Report, Category, SearchFilters } from '@/types';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 侧边栏状态
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),

      // 当前选中的报告和分类
      selectedReport: null,
      setSelectedReport: (report: Report | null) => set({ selectedReport: report }),
      selectedCategory: null,
      setSelectedCategory: (categoryId: string | null) => set({ selectedCategory: categoryId }),

      // 搜索状态
      searchQuery: '',
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      searchFilters: {},
      setSearchFilters: (filters: SearchFilters) => set({ searchFilters: filters }),

      // 主题
      theme: 'light',
      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        // 更新HTML根元素的class
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(theme);
        }
      },

      // 数据
      reports: [],
      categories: [],
      setReports: (reports: Report[]) => set({ reports }),
      setCategories: (categories: Category[]) => set({ categories }),
    }),
    {
      name: 'wendeal-reports-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        searchFilters: state.searchFilters,
      }),
    }
  )
); 