'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Report } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckSquare,
  Square,
  Trash2,
  Star,
  StarOff,
  FolderOpen,
  BookOpen,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategorySelector } from '../upload/CategorySelector';

interface BatchActionsToolbarProps {
  reports: Report[];
  className?: string;
}

export function BatchActionsToolbar({ reports, className }: BatchActionsToolbarProps) {
  const {
    selectedReports,
    setSelectedReports,
    batchMode,
    setBatchMode,
    deleteReports,
    updateReportsStatus,
    updateReportsCategory,
    toggleReportsFavorite,
  } = useAppStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const selectedCount = selectedReports.length;
  const totalCount = reports.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  const selectedReportObjects = reports.filter(report => selectedReports.includes(report.id));
  const favoriteCount = selectedReportObjects.filter(report => report.isFavorite).length;
  const shouldSetFavorite = favoriteCount < selectedCount;

  // 切换批量模式
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    if (batchMode) {
      setSelectedReports([]);
    }
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (allSelected || someSelected) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmBatchDelete = () => {
    deleteReports(selectedReports);
    setDeleteDialogOpen(false);
    setSelectedReports([]);
  };

  // 批量更新状态
  const handleStatusChange = (status: Report['readStatus']) => {
    updateReportsStatus(selectedReports, status);
  };

  // 批量更新分类
  const handleCategoryChange = (categoryId: string) => {
    updateReportsCategory(selectedReports, categoryId);
    setCategoryDialogOpen(false);
  };

  // 批量切换收藏
  const handleToggleFavorite = () => {
    toggleReportsFavorite(selectedReports, shouldSetFavorite);
  };

  if (!batchMode && selectedCount === 0) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleBatchMode}
          className="gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          批量操作
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 全选按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSelectAll}
            className="gap-2"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : someSelected ? (
              <div className="h-4 w-4 border-2 border-blue-600 bg-blue-600/20 rounded" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {allSelected ? '取消全选' : '全选'}
          </Button>

          {/* 选中数量 */}
          {selectedCount > 0 && (
            <Badge variant="secondary">
              已选择 {selectedCount} 项
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <>
              {/* 状态操作 */}
              <Select onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="设置状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unread">未阅读</SelectItem>
                  <SelectItem value="reading">阅读中</SelectItem>
                  <SelectItem value="completed">已阅读</SelectItem>
                </SelectContent>
              </Select>

              {/* 分类操作 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryDialogOpen(true)}
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                移动分类
              </Button>

              {/* 收藏操作 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                className="gap-2"
              >
                {shouldSetFavorite ? (
                  <>
                    <Star className="h-4 w-4" />
                    添加收藏
                  </>
                ) : (
                  <>
                    <StarOff className="h-4 w-4" />
                    取消收藏
                  </>
                )}
              </Button>

              {/* 删除操作 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelete}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </>
          )}

          {/* 退出批量模式 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBatchMode}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            退出
          </Button>
        </div>
      </div>

      {/* 分类选择对话框 */}
      {categoryDialogOpen && (
        <div className="mt-4 p-4 bg-background border rounded-lg">
          <div className="mb-3">
            <h4 className="font-medium">选择目标分类</h4>
            <p className="text-sm text-muted-foreground">
              将 {selectedCount} 个报告移动到指定分类
            </p>
          </div>
          <CategorySelector
            value=""
            onValueChange={handleCategoryChange}
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryDialogOpen(false)}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedCount} 个报告吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 