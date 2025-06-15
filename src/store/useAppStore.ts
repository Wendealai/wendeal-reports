import { create } from 'zustand';
import { AppState, Report, Category, SearchFilters, SearchHistory, SavedSearch, SortOptions } from '@/types';
import { reportsApi, categoriesApi } from '@/lib/api-client';

export const useAppStore = create<AppState>()((set, get) => ({
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

  // 数据加载状态
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),

  // 数据
  reports: [],
  categories: [],
  setReports: (reports: Report[]) => set({ reports }),
  setCategories: (categories: Category[]) => set({ categories }),
  
  // 预定义分类名称（可以被用户自定义）
  predefinedCategoryNames: {
    'uncategorized': '📁 未分类',
    'tech-research': '💻 技术研究',
    'market-analysis': '📈 市场分析',
    'product-review': '🔍 产品评测',
    'industry-insights': '🔬 行业洞察',
  },
  
  // 更新预定义分类名称
  updatePredefinedCategoryName: (categoryId: string, newName: string) => {
    const { predefinedCategoryNames } = get();
    const updatedNames = {
      ...predefinedCategoryNames,
      [categoryId]: newName
    };
    set({ predefinedCategoryNames: updatedNames });
    
    // 持久化到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('predefined_category_names', JSON.stringify(updatedNames));
    }
  },
  
  // 加载预定义分类名称
  loadPredefinedCategoryNames: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('predefined_category_names');
      if (saved) {
        try {
          const parsedNames = JSON.parse(saved);
          set({ predefinedCategoryNames: parsedNames });
        } catch (error) {
          console.error('Failed to load predefined category names:', error);
        }
      }
    }
  },
  
  // 从后端数据库加载所有数据
  loadData: async () => {
    const { setLoading } = get();
    setLoading(true);
    
    try {
      console.log('🔄 开始从数据库加载数据...');
      
      // 强制从API加载数据
      // 并行加载报告和分类数据
      const [reportsResponse, categoriesResponse] = await Promise.all([
        reportsApi.getAll({ limit: 1000 }), // 加载所有报告
        categoriesApi.getAll()
      ]);

      console.log('📊 API响应 - 报告:', reportsResponse);
      console.log('📁 API响应 - 分类:', categoriesResponse);

      // 转换后端数据格式为前端格式
      const transformedReports = (reportsResponse.reports || []).map((report: any) => {
        // 创建分类ID映射
        let frontendCategoryId = 'uncategorized';
        if (report.category && report.category.name) {
          const categoryNameMap: { [key: string]: string } = {
            '技术研究': 'tech-research',
            '市场分析': 'market-analysis', 
            '产品评测': 'product-review',
            '行业洞察': 'industry-insights'
          };
          frontendCategoryId = categoryNameMap[report.category.name] || 'uncategorized';
        } else if (report.categoryId) {
          // 如果没有category对象但有categoryId，尝试从缓存的分类中查找
          const category = (categoriesResponse.categories || []).find((c: any) => c.id === report.categoryId);
          if (category) {
            const categoryNameMap: { [key: string]: string } = {
              '技术研究': 'tech-research',
              '市场分析': 'market-analysis', 
              '产品评测': 'product-review',
              '行业洞察': 'industry-insights'
            };
            frontendCategoryId = categoryNameMap[category.name] || 'uncategorized';
          }
        }

        return {
          id: report.id,
          title: report.title,
          description: report.summary || report.content?.substring(0, 200) || '',
          category: frontendCategoryId,
          tags: report.tags || [],
          content: report.content || '',
          filePath: '', // 后端没有文件路径
          createdAt: new Date(report.createdAt),
          updatedAt: new Date(report.updatedAt),
          isFavorite: false, // 后端暂时没有收藏功能
          readStatus: report.status === 'published' ? 'unread' : 'unread' as const,
          fileSize: 0,
          wordCount: report.content?.length || 0
        };
      });
      
      console.log('✅ 转换后的报告数据:', transformedReports);

      set({ 
        reports: transformedReports,
        categories: categoriesResponse.categories || []
      });
      
      console.log(`✅ 数据加载完成: ${transformedReports.length} 个报告, ${(categoriesResponse.categories || []).length} 个分类`);
    } catch (error) {
      console.error('❌ 从数据库加载数据失败:', error);
      throw new Error(`数据库加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  },

  // 刷新数据
  refreshData: async () => {
    const { loadData } = get();
    await loadData();
  },
  
  // 检查登录状态
  checkLoginStatus: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return false;
    
    try {
      // 真实token，调用API来验证
      await reportsApi.getAll({ limit: 1 });
      return true;
    } catch (error) {
      // Token无效，清除本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
      }
      return false;
    }
  },
  
  // 添加新报告（直接使用数据库）
  addReport: async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Adding report to database...', report);
    
    try {
      // 强制使用数据库API创建报告
      console.log('Creating report in database...');
      
      // 如果有分类，先确保分类存在，然后使用数据库
      let categoryId = report.category || 'uncategorized';
      
      if (report.category && report.category !== 'uncategorized') {
        console.log('Ensuring category exists:', report.category);
        
        // 如果是自定义分类（以category-开头），直接使用ID
        if (report.category.startsWith('category-')) {
          console.log('Using custom category ID:', report.category);
          categoryId = report.category;
        } else {
          // 定义分类映射（预定义分类）
          const categoryDefinitions = {
            'tech-research': { name: '技术研究', icon: '💻', color: '#3B82F6' },
            'market-analysis': { name: '市场分析', icon: '📈', color: '#10B981' },
            'product-review': { name: '产品评测', icon: '🔍', color: '#F59E0B' },
            'industry-insights': { name: '行业洞察', icon: '🔬', color: '#8B5CF6' }
          };
          
          const categoryDef = categoryDefinitions[report.category as keyof typeof categoryDefinitions];
          if (categoryDef) {
            try {
              const categoryResponse = await categoriesApi.create(categoryDef);
              categoryId = categoryResponse.category.id;
              console.log('Category created/found:', categoryId);
            } catch (error) {
              // 可能已存在，尝试获取
              console.log('Category might exist, continuing with original ID');
              categoryId = report.category;
            }
          } else {
            // 未知分类，使用原始ID
            console.log('Unknown category, using original ID:', report.category);
            categoryId = report.category;
          }
        }
      }
      
      // 准备API数据，确保包含所有必需字段
      const apiData = {
        title: report.title,
        content: report.content || '',
        summary: report.description || '',
        status: 'published' as const,
        priority: 'medium' as const,
        categoryId: categoryId,
        tags: report.tags || [],
      };
      
      console.log('Sending API data:', apiData);
      
      const response = await reportsApi.create(apiData);
      console.log('API response:', response);

      // 更新本地状态（作为缓存）
      const { reports } = get();
      const newReport = {
        id: response.report.id,
        title: response.report.title,
        description: response.report.summary || response.report.content?.substring(0, 200) || '',
        category: response.report.categoryId || 'uncategorized',
        tags: response.report.tags || [],
        content: response.report.content,
        filePath: report.filePath || '',
        createdAt: new Date(response.report.createdAt),
        updatedAt: new Date(response.report.updatedAt),
        isFavorite: false,
        readStatus: 'unread' as const,
        fileSize: report.fileSize || 0,
        wordCount: report.wordCount || 0
      };
      
      set({ reports: [...reports, newReport] });
      console.log('Report created in database successfully');
      
      // 重新加载分类数据以更新导航栏
      try {
        const categoriesResponse = await categoriesApi.getAll();
        set({ categories: categoriesResponse.categories || [] });
        console.log('Categories refreshed after report creation');
      } catch (categoryError) {
        console.warn('Failed to refresh categories:', categoryError);
      }
      
      return newReport;
    } catch (error) {
      console.error('Failed to create report in database:', error);
      throw new Error(`数据库操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },
  
  // 报告编辑功能（直接使用数据库）
  updateReport: async (reportId: string, updates: Partial<Report>) => {
    console.log('📝 更新报告开始:', { reportId, updates });
    
    try {
      console.log('✅ 准备使用数据库更新');
      
      // 构建更新数据，只发送实际需要更新的字段
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.description !== undefined) updateData.summary = updates.description;
      if (updates.category !== undefined) updateData.categoryId = updates.category;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.readStatus !== undefined) {
        updateData.status = updates.readStatus === 'completed' ? 'published' : 'draft';
      }
      
      console.log('🧪 更新数据:', updateData);
      
      const response = await reportsApi.update(reportId, updateData);

      // 更新本地状态（作为缓存）
      const { reports, selectedReport } = get();
      const updatedReports = reports.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              ...updates, 
              updatedAt: new Date(response.report.updatedAt)
            }
          : report
      );
      
      const newSelectedReport = selectedReport?.id === reportId 
        ? updatedReports.find(r => r.id === reportId) || selectedReport
        : selectedReport;
      
      set({ 
        reports: updatedReports,
        selectedReport: newSelectedReport
      });

      console.log('✅ 报告更新成功');
      return response.report;
    } catch (error) {
      console.error('❌ 数据库更新失败:', error);
      throw new Error(`数据库更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  // 删除报告（直接使用数据库）
  deleteReport: async (reportId: string) => {
    try {
      console.log('🗑️ 删除数据库中的报告:', reportId);
      await reportsApi.delete(reportId);

      // 更新本地状态（作为缓存）
      const { reports, selectedReport, selectedReports } = get();
      
      const updatedReports = reports.filter(report => report.id !== reportId);
      const updatedSelectedReports = selectedReports.filter((id: string) => id !== reportId);
      
      set({ 
        reports: updatedReports,
        selectedReports: updatedSelectedReports,
        selectedReport: selectedReport?.id === reportId ? null : selectedReport
      });
      
      console.log('✅ 本地状态更新完成，强制刷新数据...');
      
      // 强制重新加载数据确保同步
      setTimeout(async () => {
        try {
          await get().loadData();
          console.log('✅ 数据重新加载完成');
        } catch (error) {
          console.warn('⚠️ 重新加载数据失败:', error);
        }
      }, 100);
      
      console.log('✅ 报告删除成功');
    } catch (error) {
      console.error('❌ 数据库删除失败:', error);
      throw new Error(`数据库删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  // 批量删除报告（同步到后端）
  deleteReports: async (reportIds: string[]) => {
    try {
      // 并行删除所有报告
      await Promise.all(reportIds.map(id => reportsApi.delete(id)));

      // 更新本地状态
      const { reports, selectedReport } = get();
      const updatedReports = reports.filter(report => !reportIds.includes(report.id));
      
      set({ 
        reports: updatedReports,
        selectedReports: [],
        selectedReport: selectedReport && reportIds.includes(selectedReport.id) ? null : selectedReport
      });
    } catch (error) {
      console.error('Failed to delete reports:', error);
      throw error;
    }
  },

  // 切换收藏状态（同步到后端）
  toggleFavorite: async (reportId: string) => {
    const { reports, selectedReport } = get();
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    try {
      await reportsApi.update(reportId, {
        isFavorite: !report.isFavorite
      });

      // 更新本地状态
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
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  },

  // 批量更新报告状态（同步到后端）
  updateReportsStatus: async (reportIds: string[], status: Report['readStatus']) => {
    try {
      // 并行更新所有报告
      await Promise.all(reportIds.map(id => 
        reportsApi.update(id, { 
          status: status === 'completed' ? 'published' : 'draft' 
        })
      ));

      // 更新本地状态
      const { reports } = get();
      const updatedReports = reports.map(report => 
        reportIds.includes(report.id)
          ? { ...report, readStatus: status, updatedAt: new Date() }
          : report
      );
      set({ reports: updatedReports });
    } catch (error) {
      console.error('Failed to update reports status:', error);
      throw error;
    }
  },

  // 批量更新报告分类（同步到后端）
  updateReportsCategory: async (reportIds: string[], categoryId: string) => {
    try {
      // 并行更新所有报告
      await Promise.all(reportIds.map(id => 
        reportsApi.update(id, { categoryId })
      ));

      // 更新本地状态
      const { reports } = get();
      const updatedReports = reports.map(report => 
        reportIds.includes(report.id)
          ? { ...report, category: categoryId, updatedAt: new Date() }
          : report
      );
      set({ reports: updatedReports });
    } catch (error) {
      console.error('Failed to update reports category:', error);
      throw error;
    }
  },

  // 批量切换收藏（同步到后端）
  toggleReportsFavorite: async (reportIds: string[], favorite: boolean) => {
    try {
      // 并行更新所有报告
      await Promise.all(reportIds.map(id => 
        reportsApi.update(id, { isFavorite: favorite })
      ));

      // 更新本地状态
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
    } catch (error) {
      console.error('Failed to toggle reports favorite:', error);
      throw error;
    }
  },

  // 替换报告文件（同步到后端）
  replaceReportFile: async (reportId: string, newFilePath: string, fileSize?: number, wordCount?: number) => {
    try {
      await reportsApi.update(reportId, {
        filePath: newFilePath,
        fileSize,
        wordCount
      });

      // 更新本地状态
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
    } catch (error) {
      console.error('Failed to replace report file:', error);
      throw error;
    }
  },

  // 更新分类（同步到后端）
  updateCategory: async (categoryId: string, updates: Partial<Category>) => {
    try {
      await categoriesApi.update(categoryId, updates);

      // 更新本地状态
      const { categories } = get();
      const updateCategoryInTree = (categories: Category[]): Category[] => {
        return categories.map(category => {
          if (category.id === categoryId) {
            return { ...category, ...updates };
          }
          if (category.children && category.children.length > 0) {
            return {
              ...category,
              children: updateCategoryInTree(category.children)
            };
          }
          return category;
        });
      };

      const updatedCategories = updateCategoryInTree(categories);
      set({ categories: updatedCategories });
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  // 添加分类（同步到后端）
  addCategory: async (category: Omit<Category, 'id' | 'reportCount'>) => {
    try {
      const response = await categoriesApi.create(category);

      // 更新本地状态
      const { categories } = get();
      const newCategory = { ...response.category, reportCount: 0, children: [] };
      set({ categories: [...categories, newCategory] });
      
      return newCategory;
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  },

  // 删除分类（同步到后端）
  deleteCategory: async (categoryId: string) => {
    try {
      await categoriesApi.delete(categoryId);

      // 更新本地状态
      const { categories } = get();
      const removeCategoryFromTree = (categories: Category[]): Category[] => {
        return categories.filter(category => {
          if (category.id === categoryId) {
            return false;
          }
          if (category.children && category.children.length > 0) {
            category.children = removeCategoryFromTree(category.children);
          }
          return true;
        });
      };

      const updatedCategories = removeCategoryFromTree(categories);
      set({ categories: updatedCategories });
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }
})); 