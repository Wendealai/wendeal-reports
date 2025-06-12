'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { mockCategories, mockReports, buildCategoryTree } from '@/data/mockData';
import { DashboardSidebar } from '@/components/sidebar/DashboardSidebar';
import { ReportViewer } from '@/components/report-viewer/ReportViewer';
import { SearchBar } from '@/components/search/SearchBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Upload, Settings } from 'lucide-react';

export default function DashboardPage() {
  const { 
    setCategories, 
    setReports, 
    selectedReport,
    selectedCategory 
  } = useAppStore();

  // 初始化数据
  useEffect(() => {
    const categoryTree = buildCategoryTree(mockCategories);
    setCategories(categoryTree);
    setReports(mockReports);
  }, [setCategories, setReports]);

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
                <h1 className="text-2xl font-semibold text-foreground">
                  Wendeal Reports
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                <SearchBar />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  上传报告
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* 内容区域 */}
          <div className="flex-1 overflow-hidden">
            {selectedReport ? (
              <ReportViewer report={selectedReport} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <h2 className="text-xl font-medium mb-2">
                    欢迎使用 Wendeal Reports
                  </h2>
                  <p className="text-sm">
                    {selectedCategory 
                      ? '请从左侧选择一个报告开始阅读' 
                      : '请从左侧选择一个分类查看报告'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
} 