import { create } from "zustand";
import {
  AppState,
  Report,
  Category,
  SearchFilters,
  SearchHistory,
  SavedSearch,
  SortOptions,
} from "@/types";
import { reportsApi, categoriesApi } from "@/lib/api-client";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AppStore");

export const useAppStore = create<AppState>()((set, get) => ({
  // 侧边栏状态
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed: boolean) =>
    set({ sidebarCollapsed: collapsed }),

  // 当前选中的报告和分类
  selectedReport: null,
  setSelectedReport: (report: Report | null) => set({ selectedReport: report }),
  selectedCategory: null,
  setSelectedCategory: (categoryId: string | null) =>
    set({ selectedCategory: categoryId }),

  // 搜索状态
  searchQuery: "",
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  searchFilters: {},
  setSearchFilters: (filters: SearchFilters) => set({ searchFilters: filters }),
  sortOptions: { field: "updatedAt", order: "desc" },
  setSortOptions: (options: SortOptions) => set({ sortOptions: options }),
  searchHistory: [],
  addToSearchHistory: (
    query: string,
    filters: SearchFilters,
    resultCount: number,
  ) => {
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
    const updatedSavedSearches = savedSearches.filter(
      (search) => search.id !== searchId,
    );
    set({ savedSearches: updatedSavedSearches });
  },

  // 主题
  theme: "light",
  setTheme: (theme: "light" | "dark") => {
    set({ theme });
  },

  // 批量选择状态
  selectedReports: [],
  setSelectedReports: (reportIds: string[]) =>
    set({ selectedReports: reportIds }),
  batchMode: false,
  setBatchMode: (enabled: boolean) =>
    set({
      batchMode: enabled,
      selectedReports: enabled ? get().selectedReports : [],
    }),

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
    uncategorized: "📁 未分类",
    "tech-research": "💻 技术研究",
    "market-analysis": "📈 市场分析",
    "product-review": "🔍 产品评测",
    "industry-insights": "🔬 行业洞察",
  },

  // 更新预定义分类名称（基于Context7最佳实践）
  updatePredefinedCategoryName: async (categoryId: string, newName: string) => {
    // 🚀 使用Zustand推荐的函数式状态更新，确保引用相等性
    let newNamesForLocalStorage: Record<string, string> | undefined;

    try {
      set((state) => {
        const updatedNames = {
          ...state.predefinedCategoryNames,
          [categoryId]: newName,
        };
        newNamesForLocalStorage = updatedNames; // 捕获更新后的状态
        return {
          predefinedCategoryNames: updatedNames,
        };
      });

      // 持久化到localStorage，使用更严格的错误处理
      if (typeof window !== "undefined" && newNamesForLocalStorage) {
        try {
          // 验证localStorage可用性
          if (typeof Storage !== "undefined" && window.localStorage) {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            // 实际保存数据
            localStorage.setItem(
              "predefined_category_names",
              JSON.stringify(newNamesForLocalStorage),
            );
            
            // 验证保存成功
            const saved = localStorage.getItem("predefined_category_names");
            if (saved) {
              logger.debug(
                "✅ Predefined category names saved and verified:",
                JSON.parse(saved),
              );
            } else {
              throw new Error("Failed to verify localStorage save");
            }
          } else {
            throw new Error("localStorage not available");
          }
        } catch (localStorageError) {
          logger.error(
            "❌ localStorage save failed:",
            undefined,
            localStorageError,
          );
          // 尝试使用sessionStorage作为备用
          try {
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem(
                "predefined_category_names",
                JSON.stringify(newNamesForLocalStorage),
              );
              logger.warn("⚠️ Used sessionStorage as fallback");
            }
          } catch (sessionError) {
            logger.error("❌ SessionStorage fallback failed:", undefined, sessionError);
          }
        }
      }

      // 🚀 新增：同步到数据库
      try {
        // 首先尝试在数据库中查找或创建对应的分类
      const categoryMappings: Record<
        string,
        { name: string; icon: string; color: string }
      > = {
        uncategorized: { name: "未分类", icon: "📁", color: "#6B7280" },
        "tech-research": { name: "技术研究", icon: "💻", color: "#3B82F6" },
        "market-analysis": { name: "市场分析", icon: "📈", color: "#10B981" },
        "product-review": { name: "产品评测", icon: "🔍", color: "#F59E0B" },
        "industry-insights": { name: "行业洞察", icon: "🔬", color: "#8B5CF6" },
      };

      const categoryDef =
        categoryMappings[categoryId as keyof typeof categoryMappings];
      if (categoryDef) {
        // 提取新名称（去掉emoji）
        const cleanName = newName.replace(/^[^\s]*\s/, "").trim();

        // 尝试更新数据库中的分类
        const response = await fetch("/api/categories/predefined", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId,
            name: cleanName,
            icon: categoryDef.icon,
            color: categoryDef.color,
          }),
        });

        if (response.ok) {
          logger.debug("✅ 预定义分类已同步到数据库:", {
            categoryId,
            cleanName,
          });
        } else {
          logger.warn("⚠️ 数据库同步失败，但localStorage已更新:", {
            categoryId,
          });
        }
      }
    } catch (error) {
      logger.warn("⚠️ 数据库同步出错，但localStorage已更新:", undefined, error);
    }
  },

  // 加载预定义分类名称（增强错误处理）
  loadPredefinedCategoryNames: () => {
    if (typeof window !== "undefined") {
      try {
        // 优先尝试localStorage
        let saved = null;
        if (typeof Storage !== "undefined" && window.localStorage) {
          saved = localStorage.getItem("predefined_category_names");
        }
        
        // 如果localStorage失败，尝试sessionStorage
        if (!saved && typeof sessionStorage !== "undefined") {
          saved = sessionStorage.getItem("predefined_category_names");
          if (saved) {
            logger.warn("📦 Loaded from sessionStorage as fallback");
          }
        }
        
        if (saved) {
          try {
            const parsedNames = JSON.parse(saved);
            // 验证数据格式
            if (typeof parsedNames === 'object' && parsedNames !== null) {
              set({ predefinedCategoryNames: parsedNames });
              logger.debug("✅ Predefined category names loaded:", parsedNames);
            } else {
              throw new Error("Invalid data format");
            }
          } catch (parseError) {
            logger.error(
              "❌ Failed to parse predefined category names:",
              undefined,
              parseError,
            );
            // 清除损坏的数据
            try {
              localStorage.removeItem("predefined_category_names");
              sessionStorage.removeItem("predefined_category_names");
            } catch (cleanupError) {
              logger.warn("⚠️ Failed to cleanup corrupted data:", undefined, cleanupError);
            }
          }
        } else {
          logger.debug("📝 No saved predefined category names found");
        }
      } catch (error) {
        logger.error(
          "❌ Failed to load predefined category names:",
          undefined,
          error,
        );
      }
    }
  },

  // 从后端数据库加载所有数据
  loadData: async () => {
    const { setLoading } = get();
    setLoading(true);

    try {
      logger.debug("🔄 开始从数据库加载数据...");

      // 强制从API加载数据
      // 并行加载报告和分类数据
      const [reportsResponse, categoriesResponse] = await Promise.all([
        reportsApi.getAll({ limit: 1000 }), // 加载所有报告
        categoriesApi.getAll(),
      ]);

      logger.debug("📊 API响应 - 报告:", reportsResponse);
      logger.debug("📁 API响应 - 分类:", categoriesResponse);

      // 🚀 关键修复：从数据库加载预定义分类名称
      const predefinedCategoriesFromDB = (
        categoriesResponse.categories || []
      ).filter((cat: any) => cat.id && cat.id.startsWith("predefined-"));

      if (predefinedCategoriesFromDB.length > 0) {
        logger.debug("📥 从数据库加载预定义分类:", {
          predefinedCategoriesFromDB,
        });

        // 构建前端分类名称映射（从数据库ID映射到前端ID）
        const dbToFrontendMapping: Record<string, string> = {
          "predefined-uncategorized": "uncategorized",
          "predefined-tech-research": "tech-research",
          "predefined-market-analysis": "market-analysis",
          "predefined-product-review": "product-review",
          "predefined-industry-insights": "industry-insights",
        };

        // 构建新的预定义分类名称对象
        const updatedPredefinedNames: Record<string, string> = {};

        predefinedCategoriesFromDB.forEach((dbCategory: any) => {
          const frontendId = dbToFrontendMapping[dbCategory.id];
          if (frontendId && dbCategory.name && dbCategory.icon) {
            // 组合emoji和名称
            const fullName = `${dbCategory.icon} ${dbCategory.name}`;
            updatedPredefinedNames[frontendId] = fullName;
            logger.debug(
              `✅ 映射数据库分类: ${dbCategory.id} → ${frontendId} = "${fullName}"`,
            );
          }
        });

        // 合并数据库预定义分类和localStorage中的自定义名称
        const localStorageNames =
          typeof window !== "undefined"
            ? JSON.parse(
                localStorage.getItem("predefined_category_names") || "{}",
              )
            : {};

        // 🚀 关键修复：不覆盖用户已编辑的分类名称
        // 检查localStorage中是否有用户自定义的名称，如果有，则保持不变
        const currentPredefinedNames = get().predefinedCategoryNames;

        // 只有当localStorage中有用户编辑的名称时，才优先使用localStorage的值
        let finalPredefinedNames = { ...currentPredefinedNames };

        // 只添加新的数据库分类，不覆盖已存在的用户编辑
        Object.keys(updatedPredefinedNames).forEach((key) => {
          if (!localStorageNames[key] && !currentPredefinedNames[key]) {
            // 只有当localStorage和当前store中都没有这个分类时，才从数据库添加
            finalPredefinedNames[key] = updatedPredefinedNames[key];
          }
        });

        // 应用localStorage中的用户编辑（优先级最高）
        finalPredefinedNames = {
          ...finalPredefinedNames,
          ...localStorageNames,
        };

        logger.debug("🔄 保护用户编辑的分类名称合并:", {
          currentStore: currentPredefinedNames,
          fromDB: updatedPredefinedNames,
          fromLocalStorage: localStorageNames,
          final: finalPredefinedNames,
        });

        // 只有当最终结果与当前不同时才更新
        if (
          JSON.stringify(finalPredefinedNames) !==
          JSON.stringify(currentPredefinedNames)
        ) {
          set({ predefinedCategoryNames: finalPredefinedNames });
          logger.debug("✅ 更新了预定义分类名称");
        } else {
          logger.debug("✅ 预定义分类名称无需更新，保持用户编辑");
        }

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "predefined_category_names",
            JSON.stringify(finalPredefinedNames),
          );
          logger.debug("✅ 预定义分类名称已同步到localStorage和store");
        }
      } else {
        // 数据库中没有预定义分类，尝试从localStorage加载
        logger.debug("📝 数据库中没有预定义分类，尝试从localStorage加载");
        const savedNames =
          typeof window !== "undefined"
            ? localStorage.getItem("predefined_category_names")
            : null;
        if (savedNames) {
          try {
            const parsedNames = JSON.parse(savedNames);
            // 只有在store中还没有任何预定义名称时才设置，避免覆盖可能的初始默认值
            if (Object.keys(get().predefinedCategoryNames).length === 0) {
              set({ predefinedCategoryNames: parsedNames });
              logger.debug("📥 从localStorage加载预定义分类名称:", parsedNames);
            } else {
              logger.debug(
                "ℹ️ Store中已有预定义分类，localStorage中的值未覆盖:",
                get().predefinedCategoryNames,
              );
            }
          } catch (error) {
            logger.error("解析localStorage分类名称失败:", undefined, error);
          }
        } else {
          logger.debug("ℹ️ localStorage中也没有预定义分类名称");
        }
      }

      // 转换后端数据格式为前端格式
      const transformedReports = (reportsResponse.reports || []).map(
        (apiReport: any) => {
          // 创建分类ID映射
          let frontendCategoryId = "uncategorized";

          // 处理分类ID映射
          if (apiReport.categoryId) {
            // 如果有categoryId，尝试从缓存的分类中查找
            const category = (categoriesResponse.categories || []).find(
              (c: any) => c.id === apiReport.categoryId,
            );
            if (category) {
              const categoryNameMap: { [key: string]: string } = {
                技术研究: "tech-research",
                市场分析: "market-analysis",
                产品评测: "product-review",
                行业洞察: "industry-insights",
              };
              frontendCategoryId =
                categoryNameMap[category.name] || "uncategorized";
            }
          }

          // 转换为前端Report类型
          const frontendReport: Report = {
            id: apiReport.id,
            title: apiReport.title,
            description:
              apiReport.description ||
              apiReport.content?.substring(0, 200) ||
              "",
            category: frontendCategoryId,
            tags: apiReport.tags || [],
            content: apiReport.content || "",
            filePath: "", // 后端没有文件路径
            createdAt: new Date(apiReport.createdAt),
            updatedAt: new Date(apiReport.updatedAt),
            isFavorite: false, // 后端暂时没有收藏功能
            readStatus:
              apiReport.status === "completed" ? "completed" : "unread",
            fileSize: 0,
            wordCount: apiReport.content?.length || 0,
          };

          return frontendReport;
        },
      );

      logger.debug("✅ 转换后的报告数据:", {
        count: transformedReports.length,
      });

      // 转换分类数据
      const transformedCategories: Category[] = (
        categoriesResponse.categories || []
      ).map((apiCategory: any) => ({
        id: apiCategory.id,
        name: apiCategory.name,
        description: apiCategory.description,
        color: apiCategory.color,
        icon: apiCategory.icon,
        reportCount: 0, // 将在后面计算
      }));

      set({
        reports: transformedReports,
        categories: transformedCategories,
      });

      logger.debug(
        `✅ 数据加载完成: ${transformedReports.length} 个报告, ${transformedCategories.length} 个分类`,
      );
    } catch (error) {
      logger.error("❌ 从数据库加载数据失败:", undefined, error);
      throw new Error(
        `数据库加载失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
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
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return false;

    try {
      // 真实token，调用API来验证
      await reportsApi.getAll({ limit: 1 });
      return true;
    } catch (error) {
      // Token无效，清除本地存储
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_info");
      }
      return false;
    }
  },

  // 添加新报告（直接使用数据库）
  addReport: async (report: Omit<Report, "id" | "createdAt" | "updatedAt">) => {
    logger.debug("Adding report to database...", report);

    try {
      // 强制使用数据库API创建报告
      logger.debug("Creating report in database...");

      // 如果有分类，先确保分类存在，然后使用数据库
      let categoryId = report.category || "uncategorized";

      if (report.category && report.category !== "uncategorized") {
        logger.debug("Ensuring category exists", { category: report.category });

        // 如果是自定义分类（以category-开头），直接使用ID
        if (report.category.startsWith("category-")) {
          logger.debug("Using custom category ID:", {
            category: report.category,
          });
          categoryId = report.category;
        } else {
          // 定义分类映射（预定义分类）
          const categoryDefinitions = {
            "tech-research": { name: "技术研究", icon: "💻", color: "#3B82F6" },
            "market-analysis": {
              name: "市场分析",
              icon: "📈",
              color: "#10B981",
            },
            "product-review": {
              name: "产品评测",
              icon: "🔍",
              color: "#F59E0B",
            },
            "industry-insights": {
              name: "行业洞察",
              icon: "🔬",
              color: "#8B5CF6",
            },
          };

          const categoryDef =
            categoryDefinitions[
              report.category as keyof typeof categoryDefinitions
            ];
          if (categoryDef) {
            try {
              const categoryResponse = await categoriesApi.create(categoryDef);
              categoryId = categoryResponse.category.id;
              logger.debug("Category created/found:", { categoryId });
            } catch (error) {
              // 可能已存在，尝试获取
              logger.debug("Category might exist, continuing with original ID");
              categoryId = report.category;
            }
          } else {
            // 未知分类，使用原始ID
            logger.debug("Unknown category, using original ID:", {
              category: report.category,
            });
            categoryId = report.category;
          }
        }
      }

      // 准备API数据，确保包含所有必需字段
      const apiData = {
        title: report.title,
        content: report.content || "",
        description: report.description || "",
        status: "published" as const,
        categoryId: categoryId,
        tags: report.tags || [],
      };

      logger.debug("Sending API data:", apiData);

      const response = await reportsApi.create(apiData);
      logger.debug("API response:", response);

      // 更新本地状态（作为缓存）
      const { reports } = get();
      const newReport: Report = {
        id: response.report.id,
        title: response.report.title,
        description:
          response.report.description ||
          response.report.content?.substring(0, 200) ||
          "",
        category: response.report.categoryId || "uncategorized",
        tags: response.report.tags || [],
        content: response.report.content || "",
        filePath: report.filePath || "",
        createdAt: new Date(response.report.createdAt),
        updatedAt: new Date(response.report.updatedAt),
        isFavorite: false,
        readStatus: "unread" as const,
        fileSize: report.fileSize || 0,
        wordCount: report.wordCount || 0,
      };

      set({ reports: [...reports, newReport] });
      logger.debug("Report created in database successfully");

      // 重新加载分类数据以更新导航栏
      try {
        const categoriesResponse = await categoriesApi.getAll();
        const transformedCategories: Category[] = (
          categoriesResponse.categories || []
        ).map((apiCategory: any) => ({
          id: apiCategory.id,
          name: apiCategory.name,
          description: apiCategory.description,
          color: apiCategory.color,
          icon: apiCategory.icon,
          reportCount: 0,
        }));
        set({ categories: transformedCategories });
        logger.debug("Categories refreshed after report creation");
      } catch (categoryError) {
        logger.warn("Failed to refresh categories:", undefined, categoryError);
      }

      return newReport;
    } catch (error) {
      logger.error("Failed to create report in database:", undefined, error);
      throw new Error(
        `数据库操作失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  },

  // 报告编辑功能（直接使用数据库）
  updateReport: async (reportId: string, updates: Partial<Report>) => {
    logger.debug("📝 更新报告开始:", { reportId, updates });

    try {
      logger.debug("✅ 准备使用数据库更新");

      // 构建更新数据，只发送实际需要更新的字段
      const updateData: Record<string, unknown> = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.category !== undefined)
        updateData.categoryId = updates.category;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.readStatus !== undefined) {
        updateData.status =
          updates.readStatus === "completed" ? "completed" : "unread";
      }

      logger.debug("🧪 更新数据:", updateData);

      const response = await reportsApi.update(reportId, updateData);

      // 更新本地状态（作为缓存）
      const { reports, selectedReport } = get();
      const updatedReports = reports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              ...updates,
              updatedAt: new Date(response.report.updatedAt),
            }
          : report,
      );

      const newSelectedReport =
        selectedReport?.id === reportId
          ? updatedReports.find((r) => r.id === reportId) || selectedReport
          : selectedReport;

      set({
        reports: updatedReports,
        selectedReport: newSelectedReport,
      });

      logger.debug("✅ 报告更新成功");
      return response.report;
    } catch (error) {
      logger.error("❌ 数据库更新失败:", undefined, error);
      throw new Error(
        `数据库更新失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  },

  // 删除报告（直接使用数据库）
  deleteReport: async (reportId: string) => {
    try {
      logger.debug("🗑️ 删除数据库中的报告:", { reportId });
      await reportsApi.delete(reportId);

      // 更新本地状态（作为缓存）
      const { reports, selectedReport, selectedReports } = get();

      const updatedReports = reports.filter((report) => report.id !== reportId);
      const updatedSelectedReports = selectedReports.filter(
        (id: string) => id !== reportId,
      );

      set({
        reports: updatedReports,
        selectedReports: updatedSelectedReports,
        selectedReport: selectedReport?.id === reportId ? null : selectedReport,
      });

      logger.debug("✅ 本地状态更新完成，强制刷新数据...");

      // 强制重新加载数据确保同步
      setTimeout(async () => {
        try {
          await get().loadData();
          logger.debug("✅ 数据重新加载完成");
        } catch (error) {
          logger.warn("⚠️ 重新加载数据失败:", undefined, error);
        }
      }, 100);

      logger.debug("✅ 报告删除成功");
    } catch (error) {
      logger.error("❌ 数据库删除失败:", undefined, error);
      throw new Error(
        `数据库删除失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  },

  // 批量删除报告（同步到后端）
  deleteReports: async (reportIds: string[]) => {
    try {
      // 并行删除所有报告
      await Promise.all(reportIds.map((id) => reportsApi.delete(id)));

      // 更新本地状态
      const { reports, selectedReport } = get();
      const updatedReports = reports.filter(
        (report) => !reportIds.includes(report.id),
      );

      set({
        reports: updatedReports,
        selectedReports: [],
        selectedReport:
          selectedReport && reportIds.includes(selectedReport.id)
            ? null
            : selectedReport,
      });
    } catch (error) {
      logger.error("Failed to delete reports:", undefined, error);
      throw error;
    }
  },

  // 切换收藏状态（同步到后端）
  toggleFavorite: async (reportId: string) => {
    const { reports, selectedReport } = get();
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    try {
      await reportsApi.update(reportId, {
        isFavorite: !report.isFavorite,
      });

      // 更新本地状态
      const updatedReports = reports.map((report) =>
        report.id === reportId
          ? { ...report, isFavorite: !report.isFavorite, updatedAt: new Date() }
          : report,
      );

      // 如果当前选中的报告就是被更新的报告，同步更新selectedReport
      const newSelectedReport =
        selectedReport?.id === reportId
          ? updatedReports.find((r) => r.id === reportId) || selectedReport
          : selectedReport;

      set({
        reports: updatedReports,
        selectedReport: newSelectedReport,
      });
    } catch (error) {
      logger.error("Failed to toggle favorite:", undefined, error);
      throw error;
    }
  },

  // 批量更新报告状态（同步到后端）
  updateReportsStatus: async (
    reportIds: string[],
    status: Report["readStatus"],
  ) => {
    try {
      // 并行更新所有报告
      await Promise.all(
        reportIds.map((id) =>
          reportsApi.update(id, {
            status: status === "completed" ? "completed" : "unread",
          }),
        ),
      );

      // 更新本地状态
      const { reports } = get();
      const updatedReports = reports.map((report) =>
        reportIds.includes(report.id)
          ? { ...report, readStatus: status, updatedAt: new Date() }
          : report,
      );
      set({ reports: updatedReports });
    } catch (error) {
      logger.error("Failed to update reports status:", undefined, error);
      throw error;
    }
  },

  // 批量更新报告分类（同步到后端）
  updateReportsCategory: async (reportIds: string[], categoryId: string) => {
    try {
      // 并行更新所有报告
      await Promise.all(
        reportIds.map((id) => reportsApi.update(id, { categoryId })),
      );

      // 更新本地状态
      const { reports } = get();
      const updatedReports = reports.map((report) =>
        reportIds.includes(report.id)
          ? { ...report, category: categoryId, updatedAt: new Date() }
          : report,
      );
      set({ reports: updatedReports });
    } catch (error) {
      logger.error("Failed to update reports category:", undefined, error);
      throw error;
    }
  },

  // 批量切换收藏（同步到后端）
  toggleReportsFavorite: async (reportIds: string[], favorite: boolean) => {
    try {
      // 并行更新所有报告
      await Promise.all(
        reportIds.map((id) => reportsApi.update(id, { isFavorite: favorite })),
      );

      // 更新本地状态
      const { reports, selectedReport } = get();
      const updatedReports = reports.map((report) =>
        reportIds.includes(report.id)
          ? { ...report, isFavorite: favorite, updatedAt: new Date() }
          : report,
      );

      // 如果当前选中的报告在更新列表中，同步更新selectedReport
      const newSelectedReport =
        selectedReport && reportIds.includes(selectedReport.id)
          ? updatedReports.find((r) => r.id === selectedReport.id) ||
            selectedReport
          : selectedReport;

      set({
        reports: updatedReports,
        selectedReport: newSelectedReport,
      });
    } catch (error) {
      logger.error("Failed to toggle reports favorite:", undefined, error);
      throw error;
    }
  },

  // 替换报告文件（同步到后端）
  replaceReportFile: async (
    reportId: string,
    newFilePath: string,
    fileSize?: number,
    wordCount?: number,
  ) => {
    try {
      await reportsApi.update(reportId, {
        filePath: newFilePath,
        fileSize,
        wordCount,
      });

      // 更新本地状态
      const { reports, selectedReport } = get();
      const updatedReports = reports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              filePath: newFilePath,
              fileSize: fileSize || report.fileSize,
              wordCount: wordCount || report.wordCount,
              updatedAt: new Date(),
            }
          : report,
      );

      const newSelectedReport =
        selectedReport?.id === reportId
          ? updatedReports.find((r) => r.id === reportId) || selectedReport
          : selectedReport;

      set({
        reports: updatedReports,
        selectedReport: newSelectedReport,
      });
    } catch (error) {
      logger.error("Failed to replace report file:", undefined, error);
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
        return categories.map((category) => {
          if (category.id === categoryId) {
            return { ...category, ...updates };
          }
          if (category.children) {
            return {
              ...category,
              children: updateCategoryInTree(category.children),
            };
          }
          return category;
        });
      };

      set({ categories: updateCategoryInTree(categories) });
    } catch (error) {
      logger.error("Failed to update category:", undefined, error);
      throw error;
    }
  },

  // 添加分类（同步到后端）
  addCategory: async (category: Omit<Category, "id" | "reportCount">) => {
    try {
      const response = await categoriesApi.create({
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
      });

      const newCategory: Category = {
        id: response.category.id,
        name: response.category.name,
        description: response.category.description,
        color: response.category.color,
        icon: response.category.icon,
        reportCount: 0,
        parentId: category.parentId,
      };

      // 更新本地状态
      const { categories } = get();
      if (category.parentId) {
        // 添加到父分类的children中
        const updateCategoryInTree = (categories: Category[]): Category[] => {
          return categories.map((cat) => {
            if (cat.id === category.parentId) {
              return {
                ...cat,
                children: [...(cat.children || []), newCategory],
              };
            }
            if (cat.children) {
              return {
                ...cat,
                children: updateCategoryInTree(cat.children),
              };
            }
            return cat;
          });
        };
        set({ categories: updateCategoryInTree(categories) });
      } else {
        // 添加到根级别
        set({ categories: [...categories, newCategory] });
      }

      return newCategory;
    } catch (error) {
      logger.error("Failed to add category:", undefined, error);
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
        return categories
          .filter((category) => category.id !== categoryId)
          .map((category) => ({
            ...category,
            children: category.children
              ? removeCategoryFromTree(category.children)
              : undefined,
          }));
      };

      set({ categories: removeCategoryFromTree(categories) });
    } catch (error) {
      logger.error("Failed to delete category:", undefined, error);
      throw error;
    }
  },
}));
