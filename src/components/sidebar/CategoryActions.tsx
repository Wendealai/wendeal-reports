"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Edit3, Trash2, FolderPlus } from "lucide-react";
import { Category } from "@/types";

interface CategoryActionsProps {
  category: Category;
  onRename: (categoryId: string, newName: string) => void;
}

export function CategoryActions({ category, onRename }: CategoryActionsProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(category.name);

  const handleRename = () => {
    if (newName.trim() && newName !== category.name) {
      onRename(category.id, newName.trim());
    }
    setIsRenameDialogOpen(false);
  };

  const handleDelete = () => {
    if (confirm("确定要删除这个分类吗？删除后其下的报告将被移动到未分类。")) {
      // TODO: 实现分类删除逻辑
      console.log("删除分类:", category.id);
    }
  };

  const openRenameDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewName(category.name);
    setIsRenameDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={openRenameDialog}>
            <Edit3 className="h-4 w-4 mr-2" />
            重命名
          </DropdownMenuItem>

          <DropdownMenuItem disabled>
            <FolderPlus className="h-4 w-4 mr-2" />
            添加子分类
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
            disabled
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除分类
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 重命名对话框 */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>重命名分类</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">分类名称</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
                placeholder="请输入新的分类名称"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleRename}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
