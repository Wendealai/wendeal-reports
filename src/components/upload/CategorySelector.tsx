"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Folder } from "lucide-react";
import { Category } from "@/types";
import { useAppStore } from "@/store/useAppStore";

interface CategorySelectorProps {
  value?: string;
  onValueChange: (categoryId: string) => void;
  placeholder?: string;
  className?: string;
}

export function CategorySelector({
  value,
  onValueChange,
  placeholder = "选择分类",
  className,
}: CategorySelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const { categories, setCategories } = useAppStore();

  // 扁平化分类列表，包含层级显示
  const flattenCategories = (
    cats: Category[],
    level = 0,
  ): Array<{ category: Category; level: number }> => {
    const result: Array<{ category: Category; level: number }> = [];

    cats.forEach((cat) => {
      // 排除未分类，因为这是默认选项
      if (cat.id !== "uncategorized") {
        result.push({ category: cat, level });
        if (cat.children) {
          result.push(...flattenCategories(cat.children, level + 1));
        }
      }
    });

    return result;
  };

  const flatCategories = flattenCategories(categories);

  const generateCategoryId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: Category = {
      id: generateCategoryId(newCategoryName),
      name: newCategoryName.trim(),
      reportCount: 0,
      icon: "Folder",
      description: newCategoryDescription.trim() || undefined,
    };

    // 添加到分类列表（作为顶级分类）
    setCategories([...categories, newCategory]);

    // 选择新创建的分类
    onValueChange(newCategory.id);

    // 重置表单并关闭对话框
    setNewCategoryName("");
    setNewCategoryDescription("");
    setIsCreateDialogOpen(false);
  };

  const openCreateDialog = () => {
    setNewCategoryName("");
    setNewCategoryDescription("");
    setIsCreateDialogOpen(true);
  };

  return (
    <>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* 默认未分类选项 */}
          <SelectItem value="uncategorized">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span>未分类</span>
            </div>
          </SelectItem>

          {/* 现有分类 */}
          {flatCategories.map(({ category, level }) => (
            <SelectItem key={category.id} value={category.id}>
              <div
                className="flex items-center gap-2"
                style={{ paddingLeft: `${level * 12}px` }}
              >
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>{category.name}</span>
                {category.reportCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({category.reportCount})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}

          {/* 创建新分类选项 */}
          <SelectItem value="__create_new__">
            <div
              className="flex items-center gap-2 text-primary cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                openCreateDialog();
              }}
            >
              <Plus className="h-4 w-4" />
              <span>创建新分类</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* 创建新分类对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              创建新分类
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryName">分类名称 *</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="请输入分类名称"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoryDescription">分类描述</Label>
              <Textarea
                id="categoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="请输入分类描述（可选）"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
            >
              创建分类
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
