"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Report } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit,
  Star,
  StarOff,
  Trash2,
  Upload,
  Eye,
  Copy,
} from "lucide-react";
import { ReportEditDialog } from "./ReportEditDialog";
import { FileReplaceDialog } from "./FileReplaceDialog";

interface ReportCardActionsProps {
  report: Report;
  onMenuOpenChange?: (open: boolean) => void;
}

export function ReportCardActions({
  report,
  onMenuOpenChange,
}: ReportCardActionsProps) {
  const { deleteReport, toggleFavorite, setSelectedReport } = useAppStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedReport(report);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditDialogOpen(true);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(report.id);
  };

  const handleReplaceFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setReplaceDialogOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteReport(report.id);
    setDeleteDialogOpen(false);
  };

  const handleCopyTitle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(report.title);
    } catch (error) {
      console.error("Failed to copy title:", error);
    }
  };

  return (
    <>
      <DropdownMenu
        modal={false}
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          onMenuOpenChange?.(open);
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            data-action-button
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={handleView}
            onSelect={(e) => e.preventDefault()}
          >
            <Eye className="h-4 w-4 mr-2" />
            查看报告
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleEdit}
            onSelect={(e) => e.preventDefault()}
          >
            <Edit className="h-4 w-4 mr-2" />
            编辑信息
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleToggleFavorite}
            onSelect={(e) => e.preventDefault()}
          >
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

          <DropdownMenuItem
            onClick={handleCopyTitle}
            onSelect={(e) => e.preventDefault()}
          >
            <Copy className="h-4 w-4 mr-2" />
            复制标题
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleReplaceFile}
            onSelect={(e) => e.preventDefault()}
          >
            <Upload className="h-4 w-4 mr-2" />
            替换文件
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            onSelect={(e) => e.preventDefault()}
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
