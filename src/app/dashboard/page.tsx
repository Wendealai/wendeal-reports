'use client';

import React, { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { mockCategories, mockReports, buildCategoryTree, calculateReportCounts } from '@/data/mockData';
import { processReports } from '@/lib/searchUtils';
import { DashboardSidebar } from '@/components/sidebar/DashboardSidebar';
import { ReportViewer } from '@/components/report-viewer/ReportViewer';
import { KanbanBoard } from '@/components/report-viewer/KanbanBoard';
import { BatchActionsToolbar } from '@/components/report-viewer/BatchActionsToolbar';
import { AdvancedSearchBar } from '@/components/search/AdvancedSearchBar';
import { SortControls } from '@/components/search/SortControls';
import { SearchResultsInfo } from '@/components/search/SearchResultsInfo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UploadDialog } from '@/components/upload/UploadDialog';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Upload, Settings } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  const { 
    setCategories, 
    setReports, 
    reports,
    selectedReport,
    selectedCategory,
    setSelectedReport,
    batchMode,
    selectedReports,
    theme,
    searchQuery,
    searchFilters,
    sortOptions
  } = useAppStore();

  // 初始化数据
  useEffect(() => {
    const categoryTree = buildCategoryTree(mockCategories, mockReports);
    setCategories(categoryTree);
    setReports(mockReports);
  }, [setCategories, setReports]);

  // 动态更新分类报告数量
  useEffect(() => {
    const updatedCategories = calculateReportCounts(mockCategories, reports);
    const categoryTree = buildCategoryTree(updatedCategories, reports);
    setCategories(categoryTree);
  }, [reports, setCategories]);

  // 获取当前分类的报告
  const getCategoryReports = () => {
    if (!selectedCategory) return [];
    
    switch (selectedCategory) {
      case 'favorites':
        return reports.filter(report => report.isFavorite);
      case 'recent':
        return reports
          .filter(report => report.readStatus !== 'unread')
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);
      case 'all':
        return reports;
      case 'uncategorized':
        return reports.filter(report => report.category === 'uncategorized' || !report.category);
      default:
        // 按分类ID筛选
        return reports.filter(report => report.category === selectedCategory);
    }
  };

  // 应用搜索、过滤和排序
  const { categoryReports, totalCategoryReports } = useMemo(() => {
    const baseReports = getCategoryReports();
    const processedReports = processReports(baseReports, searchQuery, searchFilters, sortOptions);
    return {
      categoryReports: processedReports,
      totalCategoryReports: baseReports.length
    };
  }, [searchQuery, searchFilters, sortOptions, getCategoryReports]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* 左侧边栏 */}
        <DashboardSidebar />
        
        {/* 主内容区域 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部导航栏 */}
          <header className="border-b border-border bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                {/* 显示当前状态信息 */}
                {batchMode && selectedReports.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    批量模式 - 已选择 {selectedReports.length} 项
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 flex-1">
                <AdvancedSearchBar className="flex-1 max-w-lg" />
                <SortControls />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传报告
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  当前主题: {theme}
                </span>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* 批量操作工具栏 */}
          {selectedCategory && categoryReports.length > 0 && (
            <BatchActionsToolbar 
              reports={categoryReports}
              className="mx-6 mt-4"
            />
          )}

          {/* 搜索结果信息 */}
          {selectedCategory && (
            <SearchResultsInfo
              resultCount={categoryReports.length}
              totalCount={totalCategoryReports}
              className="mx-6 mt-4"
            />
          )}

          {/* 内容区域 */}
          <div className="flex-1 overflow-hidden">
            {selectedReport ? (
              <ReportViewer report={selectedReport} />
            ) : selectedCategory && categoryReports.length > 0 ? (
              <div className="h-full">
                <KanbanBoard 
                  reports={categoryReports} 
                  onReportClick={setSelectedReport}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <h2 className="text-xl font-medium mb-2">
                    欢迎使用 Wendeal Reports
                  </h2>
                  <p className="text-sm">
                    {selectedCategory 
                      ? categoryReports.length === 0
                        ? '该分类下暂无报告'
                        : '请从左侧选择一个报告开始阅读'
                      : '请从左侧选择一个分类查看报告'
                    }
                  </p>
                  {selectedCategory && categoryReports.length === 0 && (
                    <Button 
                      className="mt-4"
                      onClick={() => setIsUploadDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      上传第一个报告
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* 上传对话框 */}
        <UploadDialog 
          open={isUploadDialogOpen} 
          onOpenChange={setIsUploadDialogOpen}
        />
      </div>
    </SidebarProvider>
  );
} 