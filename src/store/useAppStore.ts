import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, Report, Category, SearchFilters, SearchHistory, SavedSearch, SortOptions } from '@/types';

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
      sortOptions: { field: 'updatedAt', order: 'desc' },
      setSortOptions: (options: SortOptions) => set({ sortOptions: options }),
      searchHistory: [],
      addToSearchHistory: (query: string, filters: SearchFilters, resultCount: number) => {
        const { searchHistory } = get();
        const newHistoryItem: SearchHistory = {
          id: Date.now().toString(),
          query,
          filters,
          timestamp: new Date(),
          resultCount,
        };
        const updatedHistory = [newHistoryItem, ...searchHistory.slice(0, 19)]; // 保留最近20条
        set({ searchHistory: updatedHistory });
      },
      clearSearchHistory: () => set({ searchHistory: [] }),
      savedSearches: [],
      saveSearch: (name: string, query: string, filters: SearchFilters) => {
        const { savedSearches } = get();
        const newSavedSearch: SavedSearch = {
          id: Date.now().toString(),
          name,
          query,
          filters,
          createdAt: new Date(),
        };
        set({ savedSearches: [...savedSearches, newSavedSearch] });
      },
      deleteSavedSearch: (searchId: string) => {
        const { savedSearches } = get();
        const updatedSavedSearches = savedSearches.filter(search => search.id !== searchId);
        set({ savedSearches: updatedSavedSearches });
      },

      // 主题
      theme: 'light',
      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
      },

      // 批量选择状态
      selectedReports: [],
      setSelectedReports: (reportIds: string[]) => set({ selectedReports: reportIds }),
      batchMode: false,
      setBatchMode: (enabled: boolean) => set({ batchMode: enabled, selectedReports: enabled ? get().selectedReports : [] }),

      // 数据
      reports: [],
      categories: [],
      setReports: (reports: Report[]) => set({ reports }),
      setCategories: (categories: Category[]) => set({ categories }),
      
      // 添加新报告
      addReport: (report: Report) => {
        const { reports } = get();
        set({ reports: [...reports, report] });
      },
      
      // 报告编辑功能
      updateReport: (reportId: string, updates: Partial<Report>) => {
        const { reports, selectedReport } = get();
        const updatedReports = reports.map(report => 
          report.id === reportId 
            ? { ...report, ...updates, updatedAt: new Date() }
            : report
        );
        
        // 如果当前选中的报告就是被更新的报告，同步更新selectedReport
        const newSelectedReport = selectedReport?.id === reportId 
          ? updatedReports.find(r => r.id === reportId) || selectedReport
          : selectedReport;
        
        set({ 
          reports: updatedReports,
          selectedReport: newSelectedReport
        });
      },

      // 删除报告
      deleteReport: (reportId: string) => {
        const { reports, selectedReport, selectedReports } = get();
        const updatedReports = reports.filter(report => report.id !== reportId);
        const updatedSelectedReports = selectedReports.filter(id => id !== reportId);
        
        set({ 
          reports: updatedReports,
          selectedReports: updatedSelectedReports,
          selectedReport: selectedReport?.id === reportId ? null : selectedReport
        });
      },

      // 批量删除报告
      deleteReports: (reportIds: string[]) => {
        const { reports, selectedReport } = get();
        const updatedReports = reports.filter(report => !reportIds.includes(report.id));
        
        set({ 
          reports: updatedReports,
          selectedReports: [],
          selectedReport: selectedReport && reportIds.includes(selectedReport.id) ? null : selectedReport
        });
      },

      // 切换收藏状态
      toggleFavorite: (reportId: string) => {
        const { reports, selectedReport } = get();
        const updatedReports = reports.map(report => 
          report.id === reportId 
            ? { ...report, isFavorite: !report.isFavorite, updatedAt: new Date() }
            : report
        );
        
        // 如果当前选中的报告就是被更新的报告，同步更新selectedReport
        const newSelectedReport = selectedReport?.id === reportId 
          ? updatedReports.find(r => r.id === reportId) || selectedReport
          : selectedReport;
        
        set({ 
          reports: updatedReports,
          selectedReport: newSelectedReport
        });
      },

      // 批量更新报告状态
      updateReportsStatus: (reportIds: string[], status: Report['readStatus']) => {
        const { reports } = get();
        const updatedReports = reports.map(report => 
          reportIds.includes(report.id)
            ? { ...report, readStatus: status, updatedAt: new Date() }
            : report
        );
        set({ reports: updatedReports });
      },

      // 批量更新报告分类
      updateReportsCategory: (reportIds: string[], categoryId: string) => {
        const { reports } = get();
        const updatedReports = reports.map(report => 
          reportIds.includes(report.id)
            ? { ...report, category: categoryId, updatedAt: new Date() }
            : report
        );
        set({ reports: updatedReports });
      },

      // 批量切换收藏
      toggleReportsFavorite: (reportIds: string[], favorite: boolean) => {
        const { reports, selectedReport } = get();
        const updatedReports = reports.map(report => 
          reportIds.includes(report.id)
            ? { ...report, isFavorite: favorite, updatedAt: new Date() }
            : report
        );
        
        // 如果当前选中的报告在批量更新中，同步更新selectedReport
        const newSelectedReport = selectedReport && reportIds.includes(selectedReport.id)
          ? updatedReports.find(r => r.id === selectedReport.id) || selectedReport
          : selectedReport;
        
        set({ 
          reports: updatedReports,
          selectedReport: newSelectedReport
        });
      },

      // 替换报告文件
      replaceReportFile: (reportId: string, newFilePath: string, fileSize?: number, wordCount?: number) => {
        const { reports } = get();
        const updatedReports = reports.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                filePath: newFilePath,
                fileSize,
                wordCount,
                updatedAt: new Date() 
              }
            : report
        );
        set({ reports: updatedReports });
      },
      
      // 编辑功能（原有的保持兼容）
      updateCategoryName: (categoryId: string, newName: string) => {
        const updateCategoryInTree = (categories: Category[]): Category[] => {
          return categories.map(category => {
            if (category.id === categoryId) {
              return { ...category, name: newName };
            }
            if (category.children) {
              return { ...category, children: updateCategoryInTree(category.children) };
            }
            return category;
          });
        };
        
        const { categories } = get();
        const updatedCategories = updateCategoryInTree(categories);
        set({ categories: updatedCategories });
      },
      
      updateReportTitle: (reportId: string, newTitle: string) => {
        const { reports } = get();
        const updatedReports = reports.map(report => 
          report.id === reportId 
            ? { ...report, title: newTitle, updatedAt: new Date() }
            : report
        );
        set({ reports: updatedReports });
      },
    }),
    {
      name: 'wendeal-reports-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        reports: state.reports,
        categories: state.categories,
      }),
    }
  )
); 