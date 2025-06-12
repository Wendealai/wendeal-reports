'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Report } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
  MoreHorizontal,
  Edit,
  Star,
  StarOff,
  Trash2,
  Upload,
  Eye,
  Copy,
} from 'lucide-react';
import { ReportEditDialog } from './ReportEditDialog';
import { FileReplaceDialog } from './FileReplaceDialog';

interface ReportCardActionsProps {
  report: Report;
}

export function ReportCardActions({ report }: ReportCardActionsProps) {
  const { deleteReport, toggleFavorite, setSelectedReport } = useAppStore();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleView = () => {
    setSelectedReport(report);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(report.id);
  };

  const handleReplaceFile = () => {
    setReplaceDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteReport(report.id);
    setDeleteDialogOpen(false);
  };

  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(report.title);
    } catch (error) {
      console.error('Failed to copy title:', error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            data-action-button
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="h-4 w-4 mr-2" />
            查看报告
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            编辑信息
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleToggleFavorite}>
            {report.isFavorite ? (
              <>
                <StarOff className="h-4 w-4 mr-2" />
                取消收藏
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                添加收藏
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyTitle}>
            <Copy className="h-4 w-4 mr-2" />
            复制标题
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleReplaceFile}>
            <Upload className="h-4 w-4 mr-2" />
            替换文件
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除报告
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 编辑对话框 */}
      <ReportEditDialog
        report={report}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* 文件替换对话框 */}
      <FileReplaceDialog
        report={report}
        open={replaceDialogOpen}
        onOpenChange={setReplaceDialogOpen}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除报告</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除报告 &ldquo;{report.title}&rdquo; 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 