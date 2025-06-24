'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { mockReports, buildCategoryTree, calculateReportCounts } from '@/data/mockData';
import { processReports } from '@/lib/searchUtils';
import { ReportViewer } from '@/components/report-viewer/ReportViewer';
import { UploadDialog } from '@/components/upload/UploadDialog';
import { CreateReportDialog } from '@/components/upload/CreateReportDialog';
import { DashboardSidebar } from '@/components/sidebar/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Upload, Settings, FileText } from 'lucide-react';
import { safeTextContent } from '@/lib/htmlUtils';

export default function DashboardPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateReportDialogOpen, setIsCreateReportDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [draggedReport, setDraggedReport] = useState<any>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSSR, setIsSSR] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  
  const { 
    setCategories, 
    setReports, 
    reports,
    selectedReport,
    selectedCategory,
    setSelectedReport,
    setSelectedCategory,
    batchMode,
    selectedReports,
    theme,
    setTheme,
    updateReport,
    deleteReport,
    addReport,
    searchQuery,
    searchFilters,
    sortOptions,
    loading,
    loadData,
    refreshData,
    setLoading,
    loadPredefinedCategoryNames,
    categories
  } = useAppStore();

  // 客户端渲染检查（无认证）
  useEffect(() => {
    setIsClient(true);
    setIsSSR(false);
    setIsAuthenticated(true);
    setAuthLoading(false);
    
    // 单用户系统，直接加载数据
    const loadDashboardData = async () => {
      try {
        console.log('🔄 Dashboard 开始加载数据');
        await loadData();
        console.log('✅ Dashboard 数据加载完成');
        
        // 🚀 修复：移除强制重置逻辑，避免覆盖用户的分类编辑
        // 注释掉强制触发更新，让Zustand自然的状态订阅机制处理UI更新
        // setTimeout(() => {
        //   window.dispatchEvent(new CustomEvent('categoryOrderChanged'));
        //   console.log('📢 通知sidebar更新分类显示');
        // }, 100);
      } catch (error) {
        console.error('❌ Dashboard 数据加载失败:', error);
      }
    };

    loadDashboardData();
  }, [loadData]);

  // 监听文件上传成功事件
  useEffect(() => {
    const handleForceUpdate = () => {
      console.log('🔄 文件上传成功，强制刷新报告列表...');
      loadData();
    };

    window.addEventListener('forceReportUpdate', handleForceUpdate);

    return () => {
      window.removeEventListener('forceReportUpdate', handleForceUpdate);
    };
  }, [loadData]);

  // 监听分类名称变化
  useEffect(() => {
    const handleCategoryChange = () => {
      // 更新refreshKey来触发重新渲染
      setRefreshKey(prev => prev + 1);
    };

    // 监听localStorage变化和自定义事件
    window.addEventListener('storage', handleCategoryChange);
    window.addEventListener('categoryOrderChanged', handleCategoryChange);

    return () => {
      window.removeEventListener('storage', handleCategoryChange);
      window.removeEventListener('categoryOrderChanged', handleCategoryChange);
    };
  }, []);

  // 动态更新分类报告数量
  useEffect(() => {
    if (!isClient) return;
    
    console.log('Reports changed, updating categories. Reports count:', reports.length);
    
    // 直接使用store中的分类数据，不需要重新计算
    // store中的分类数据已经是从数据库加载的最新数据
    console.log('Categories already loaded from database:', categories.length);
  }, [reports, categories, isClient]);

  // 应用搜索、过滤和排序
  const { categoryReports, totalCategoryReports } = useMemo(() => {
    if (!isClient) return { categoryReports: [], totalCategoryReports: 0 };
    
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
          // 只显示真正的未分类报告：categoryId为'uncategorized'或者为空/null
          return reports.filter(report => 
            report.category === 'uncategorized' || 
            !report.category || 
            report.category === null || 
            report.category === ''
          );
        default:
          // 按分类ID筛选，确保精确匹配，避免重复显示
          return reports.filter(report => report.category === selectedCategory);
      }
    };

    const baseReports = getCategoryReports();
    const processedReports = processReports(baseReports, searchQuery, searchFilters, sortOptions);
    return {
      categoryReports: processedReports,
      totalCategoryReports: baseReports.length
    };
  }, [selectedCategory, reports, searchQuery, searchFilters, sortOptions, isClient]);

  const clearStorageAndReload = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wendeal-reports-storage');
      window.location.reload();
    }
  };

  // 按状态分组报告 - 三列布局的核心
  const reportsByStatus = useMemo(() => {
    if (!isClient) return { unread: [], reading: [], completed: [] };
    
    return {
      unread: categoryReports.filter(report => report.readStatus === 'unread'),
      reading: categoryReports.filter(report => report.readStatus === 'reading'),
      completed: categoryReports.filter(report => report.readStatus === 'completed'),
    };
  }, [categoryReports, isClient]);

  // 拖拽处理函数 - 改为异步
  const handleStatusChange = async (reportId: string, newStatus: 'unread' | 'reading' | 'completed') => {
    if (operationLoading) return;
    
    setOperationLoading(true);
    try {
      console.log('Updating report status:', reportId, newStatus);
      await updateReport(reportId, {
        readStatus: newStatus,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      alert(`更新报告状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setOperationLoading(false);
    }
  };

  // 安全的报告选择函数
  const handleReportSelect = (report: any) => {
    setSelectedReport(report);
  };

  // 删除报告处理函数 - 改为异步
  const handleDeleteReport = async (reportId: string) => {
    if (operationLoading) return;
    
    const confirmed = window.confirm('确定要删除这个报告吗？');
    if (!confirmed) return;

    setOperationLoading(true);
    try {
      console.log('Deleting report:', reportId);
      await deleteReport(reportId);
      console.log('Report deleted successfully');
    } catch (error) {
      console.error('Error deleting report:', error);
      alert(`删除报告失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setOperationLoading(false);
    }
  };

  // 拖放处理函数
  const handleDragStart = (e: React.DragEvent, report: any) => {
    setDraggedReport(report);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', report.id);
    
    // 添加拖拽样式
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedReport(null);
    setDragOverColumn(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, columnType: 'unread' | 'reading' | 'completed') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnType);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 只有当离开整个列容器时才清除高亮
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: 'unread' | 'reading' | 'completed') => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedReport && draggedReport.readStatus !== newStatus) {
      handleStatusChange(draggedReport.id, newStatus);
    }
    setDraggedReport(null);
  };

  // 获取分类显示名称的函数
  const getCategoryDisplayName = (categoryId: string): string => {
    // 添加refreshKey依赖，确保名称变化时重新计算
    const _ = refreshKey;
    
    // 特殊分类
    if (categoryId === 'all') return '所有报告';
    if (categoryId === 'favorites') return '收藏夹';
    if (categoryId === 'recent') return '最近查看';
    
    // 预定义分类名称映射
    const predefinedNames = JSON.parse(localStorage.getItem('predefined_category_names') || '{}');
    const baseCategoryNames: Record<string, string> = {
      'uncategorized': '📁 未分类',
      'tech-research': '💻 技术研究',
      'market-analysis': '📊 市场分析',
      'product-review': '🔍 产品评测',
      'industry-insights': '🔬 行业洞察'
    };
    
    // 如果是预定义分类，先检查是否有自定义名称
    if (baseCategoryNames[categoryId]) {
      return predefinedNames[categoryId] || baseCategoryNames[categoryId];
    }
    
    // 从自定义分类中查找
    const customCategories = JSON.parse(localStorage.getItem('custom_categories') || '[]');
    const customCategory = customCategories.find((cat: any) => cat.id === categoryId);
    if (customCategory) {
      return customCategory.label;
    }
    
    // 从API获取的分类中查找
    const apiCategory = categories.find(c => c.id === categoryId);
    if (apiCategory) {
      return apiCategory.name;
    }
    
    // 如果都找不到，返回分类ID
    return categoryId;
  };

  // 如果还在服务器端渲染、正在认证检查或正在加载，显示加载状态
  if (!isClient || authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#6366f1',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            animation: 'pulse 2s infinite'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            {authLoading ? '验证登录状态...' : loading ? '正在加载数据...' : '加载中...'}
          </h2>
          <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
            {authLoading ? '正在验证您的身份' : loading ? '正在从后端获取最新数据' : '正在初始化系统'}
          </p>
        </div>
      </div>
    );
  }

  // 未认证用户会被重定向到首页
  if (!isAuthenticated) {
    return null;
  }

  // 报告卡片组件
  const ReportCard = ({ report, onStatusChange }: { report: any; onStatusChange?: (status: 'unread' | 'reading' | 'completed') => void }) => (
    <div 
      draggable={true}
      onDragStart={(e) => handleDragStart(e, report)}
      onDragEnd={handleDragEnd}
      style={{ 
        border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        borderRadius: '0.5rem', 
        padding: '0.75rem',
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        cursor: operationLoading ? 'wait' : 'grab',
        marginBottom: '0.5rem',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        opacity: operationLoading ? 0.6 : 1
      }}
      onClick={() => !operationLoading && handleReportSelect(report)}
      onMouseEnter={(e) => {
        if (!draggedReport && !operationLoading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = theme === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!draggedReport && !operationLoading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onMouseDown={(e) => {
        if (!operationLoading) {
          e.currentTarget.style.cursor = 'grabbing';
        }
      }}
      onMouseUp={(e) => {
        if (!operationLoading) {
          e.currentTarget.style.cursor = 'grab';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h4 style={{ 
          fontWeight: '500', 
          fontSize: '0.875rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          flex: 1,
          margin: 0
        }}>
          {report.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteReport(report.id);
          }}
          disabled={operationLoading}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: operationLoading ? 'wait' : 'pointer',
            fontSize: '0.875rem',
            padding: '0.25rem',
            marginLeft: '0.5rem',
            opacity: operationLoading ? 0.5 : 1
          }}
          title="删除报告"
        >
          🗑️
        </button>
      </div>
      {report.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {safeTextContent(report.description, 120)}
        </p>
      )}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        fontSize: '0.625rem',
        color: theme === 'dark' ? '#94a3b8' : '#64748b'
      }}>
        <span>{report.isFavorite ? '⭐' : ''}</span>
        {onStatusChange && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!operationLoading) onStatusChange('unread'); 
              }}
              disabled={operationLoading}
              style={{ 
                padding: '2px 4px', 
                fontSize: '0.625rem', 
                backgroundColor: report.readStatus === 'unread' ? '#ef4444' : 'transparent',
                color: report.readStatus === 'unread' ? 'white' : theme === 'dark' ? '#94a3b8' : '#64748b',
                border: 'none',
                borderRadius: '2px',
                cursor: operationLoading ? 'wait' : 'pointer',
                opacity: operationLoading ? 0.5 : 1
              }}
            >
              未读
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!operationLoading) onStatusChange('reading'); 
              }}
              disabled={operationLoading}
              style={{ 
                padding: '2px 4px', 
                fontSize: '0.625rem', 
                backgroundColor: report.readStatus === 'reading' ? '#f59e0b' : 'transparent',
                color: report.readStatus === 'reading' ? 'white' : theme === 'dark' ? '#94a3b8' : '#64748b',
                border: 'none',
                borderRadius: '2px',
                cursor: operationLoading ? 'wait' : 'pointer',
                opacity: operationLoading ? 0.5 : 1
              }}
            >
              阅读中
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!operationLoading) onStatusChange('completed'); 
              }}
              disabled={operationLoading}
              style={{ 
                padding: '2px 4px', 
                fontSize: '0.625rem', 
                backgroundColor: report.readStatus === 'completed' ? '#10b981' : 'transparent',
                color: report.readStatus === 'completed' ? 'white' : theme === 'dark' ? '#94a3b8' : '#64748b',
                border: 'none',
                borderRadius: '2px',
                cursor: operationLoading ? 'wait' : 'pointer',
                opacity: operationLoading ? 0.5 : 1
              }}
            >
              已完成
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      width: '100%',
      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#000000'
    }}>
      
      {/* 左侧边栏 */}
      <DashboardSidebar />

      {/* 主内容区域 */}
      <main style={{ 
        flex: '1', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 顶部栏 */}
        <header style={{ 
          padding: '1rem', 
          borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {getCategoryDisplayName(selectedCategory || 'all')}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* 主题切换按钮 */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(209, 213, 219, 0.8)'}`,
                  backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  color: theme === 'dark' ? '#e2e8f0' : '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: theme === 'dark' 
                    ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  minWidth: '44px',
                  height: '36px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(249, 250, 251, 1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = theme === 'dark' 
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme === 'dark' 
                    ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
                title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              >
                <span style={{ fontSize: '16px' }}>
                  {theme === 'dark' ? '☀️' : '🌙'}
                </span>
              </button>
              
              <button
                onClick={() => setIsUploadDialogOpen(true)}
                disabled={operationLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: operationLoading 
                    ? 'rgba(156, 163, 175, 0.8)' 
                    : `linear-gradient(135deg, ${theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.9)'}, ${theme === 'dark' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.9)'})`,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: operationLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  height: '36px',
                  boxShadow: operationLoading 
                    ? '0 1px 3px rgba(0, 0, 0, 0.2)' 
                    : (theme === 'dark' 
                      ? '0 2px 8px rgba(59, 130, 246, 0.3)' 
                      : '0 2px 8px rgba(59, 130, 246, 0.2)')
                }}
                onMouseEnter={(e) => {
                  if (!operationLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = theme === 'dark' 
                      ? '0 4px 16px rgba(59, 130, 246, 0.4)' 
                      : '0 4px 16px rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme === 'dark' ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 1)'}, ${theme === 'dark' ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 1)'})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!operationLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme === 'dark' 
                      ? '0 2px 8px rgba(59, 130, 246, 0.3)' 
                      : '0 2px 8px rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.9)'}, ${theme === 'dark' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.9)'})`;
                  }
                }}
              >
                <Upload style={{ width: '16px', height: '16px' }} />
                上传新报告
              </button>
              
              <button
                onClick={() => setIsCreateReportDialogOpen(true)}
                disabled={operationLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: operationLoading 
                    ? 'rgba(156, 163, 175, 0.8)' 
                    : `linear-gradient(135deg, ${theme === 'dark' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.9)'}, ${theme === 'dark' ? 'rgba(236, 72, 153, 0.8)' : 'rgba(236, 72, 153, 0.9)'})`,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: operationLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  height: '36px',
                  boxShadow: operationLoading 
                    ? '0 1px 3px rgba(0, 0, 0, 0.2)' 
                    : (theme === 'dark' 
                      ? '0 2px 8px rgba(139, 92, 246, 0.3)' 
                      : '0 2px 8px rgba(139, 92, 246, 0.2)')
                }}
                onMouseEnter={(e) => {
                  if (!operationLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = theme === 'dark' 
                      ? '0 4px 16px rgba(139, 92, 246, 0.4)' 
                      : '0 4px 16px rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme === 'dark' ? 'rgba(139, 92, 246, 1)' : 'rgba(139, 92, 246, 1)'}, ${theme === 'dark' ? 'rgba(236, 72, 153, 1)' : 'rgba(236, 72, 153, 1)'})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!operationLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme === 'dark' 
                      ? '0 2px 8px rgba(139, 92, 246, 0.3)' 
                      : '0 2px 8px rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme === 'dark' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.9)'}, ${theme === 'dark' ? 'rgba(236, 72, 153, 0.8)' : 'rgba(236, 72, 153, 0.9)'})`;
                  }
                }}
              >
                <FileText style={{ width: '16px', height: '16px' }} />
                新增报告
              </button>
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {selectedReport ? (
            <ReportViewer report={selectedReport} />
          ) : selectedCategory && categoryReports.length > 0 ? (
            /* 三列看板布局 */
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '1.5rem', 
                height: '100%', 
                padding: '1.5rem' 
              }}>
                {/* 未读列 */}
                <div 
                  onDragOver={(e) => handleDragOver(e, 'unread')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'unread')}
                  style={{ 
                    backgroundColor: dragOverColumn === 'unread' 
                      ? (theme === 'dark' ? '#374151' : '#f1f5f9') 
                      : (theme === 'dark' ? '#1e293b' : '#f8fafc'),
                    borderRadius: '0.5rem',
                    border: dragOverColumn === 'unread' 
                      ? `2px dashed ${theme === 'dark' ? '#60a5fa' : '#3b82f6'}`
                      : `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    padding: '1rem', 
                    borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    borderRadius: '0.5rem 0.5rem 0 0'
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      📋 未阅读 ({reportsByStatus.unread.length})
                    </h3>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    padding: '1rem', 
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 200px)',
                    minHeight: '200px'
                  }}>
                    {reportsByStatus.unread.map((report) => (
                      <ReportCard 
                        key={report.id} 
                        report={report} 
                        onStatusChange={(status) => handleStatusChange(report.id, status as any)}
                      />
                    ))}
                    {reportsByStatus.unread.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        color: theme === 'dark' ? '#64748b' : '#94a3b8',
                        fontSize: '0.875rem',
                        marginTop: '2rem'
                      }}>
                        拖拽报告到这里设为未读
                      </div>
                    )}
                  </div>
                </div>

                {/* 阅读中列 */}
                <div 
                  onDragOver={(e) => handleDragOver(e, 'reading')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'reading')}
                  style={{ 
                    backgroundColor: dragOverColumn === 'reading' 
                      ? (theme === 'dark' ? '#451a03' : '#fef3c7') 
                      : (theme === 'dark' ? '#1e293b' : '#fffbeb'),
                    borderRadius: '0.5rem',
                    border: dragOverColumn === 'reading' 
                      ? `2px dashed ${theme === 'dark' ? '#fbbf24' : '#f59e0b'}`
                      : `1px solid ${theme === 'dark' ? '#334155' : '#fbbf24'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    padding: '1rem', 
                    borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#fbbf24'}`,
                    backgroundColor: theme === 'dark' ? '#374151' : '#fef3c7',
                    borderRadius: '0.5rem 0.5rem 0 0'
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      📖 阅读中 ({reportsByStatus.reading.length})
                    </h3>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    padding: '1rem', 
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 200px)',
                    minHeight: '200px'
                  }}>
                    {reportsByStatus.reading.map((report) => (
                      <ReportCard 
                        key={report.id} 
                        report={report} 
                        onStatusChange={(status) => handleStatusChange(report.id, status as any)}
                      />
                    ))}
                    {reportsByStatus.reading.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        color: theme === 'dark' ? '#64748b' : '#94a3b8',
                        fontSize: '0.875rem',
                        marginTop: '2rem'
                      }}>
                        拖拽报告到这里设为阅读中
                      </div>
                    )}
                  </div>
                </div>

                {/* 已完成列 */}
                <div 
                  onDragOver={(e) => handleDragOver(e, 'completed')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'completed')}
                  style={{ 
                    backgroundColor: dragOverColumn === 'completed' 
                      ? (theme === 'dark' ? '#064e3b' : '#dcfce7') 
                      : (theme === 'dark' ? '#1e293b' : '#f0fdf4'),
                    borderRadius: '0.5rem',
                    border: dragOverColumn === 'completed' 
                      ? `2px dashed ${theme === 'dark' ? '#10b981' : '#059669'}`
                      : `1px solid ${theme === 'dark' ? '#334155' : '#10b981'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    padding: '1rem', 
                    borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#10b981'}`,
                    backgroundColor: theme === 'dark' ? '#374151' : '#dcfce7',
                    borderRadius: '0.5rem 0.5rem 0 0'
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      ✅ 已完成 ({reportsByStatus.completed.length})
                    </h3>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    padding: '1rem', 
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 200px)',
                    minHeight: '200px'
                  }}>
                    {reportsByStatus.completed.map((report) => (
                      <ReportCard 
                        key={report.id} 
                        report={report} 
                        onStatusChange={(status) => handleStatusChange(report.id, status as any)}
                      />
                    ))}
                    {reportsByStatus.completed.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        color: theme === 'dark' ? '#64748b' : '#94a3b8',
                        fontSize: '0.875rem',
                        marginTop: '2rem'
                      }}>
                        拖拽报告到这里设为已完成
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  欢迎使用 Wendeal Reports
                </h2>
                <p style={{ 
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  marginBottom: '1rem' 
                }}>
                  请从左侧选择一个分类查看报告
                </p>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: theme === 'dark' ? '#94a3b8' : '#64748b'
                }}>
                  <p>总报告数: {reports.length}</p>
                  <p>当前主题: {theme}</p>
                </div>
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
      
      {/* 新增报告对话框 */}
      <CreateReportDialog
        open={isCreateReportDialogOpen}
        onOpenChange={setIsCreateReportDialogOpen}
      />

    </div>
  );
} 