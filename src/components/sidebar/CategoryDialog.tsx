'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Code, 
  TrendingUp, 
  BookOpen, 
  BarChart3, 
  Brain, 
  Globe, 
  FileText, 
  Folder,
  Palette
} from 'lucide-react';
import { Category } from '@/types';
import { useAppStore } from '@/store/useAppStore';

const iconOptions = [
  { id: 'Code', name: '代码', icon: Code },
  { id: 'TrendingUp', name: '趋势', icon: TrendingUp },
  { id: 'BookOpen', name: '书籍', icon: BookOpen },
  { id: 'BarChart3', name: '图表', icon: BarChart3 },
  { id: 'Brain', name: '大脑', icon: Brain },
  { id: 'Globe', name: '全球', icon: Globe },
  { id: 'FileText', name: '文档', icon: FileText },
  { id: 'Folder', name: '文件夹', icon: Folder },
];

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null; // 编辑模式时传入现有分类
  parentId?: string; // 创建子分类时传入父分类ID
  mode: 'create' | 'edit' | 'createSub';
}

export function CategoryDialog({ 
  open, 
  onOpenChange, 
  category, 
  parentId,
  mode 
}: CategoryDialogProps) {
  const { categories, setCategories } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Folder',
  });
  const [isLoading, setIsLoading] = useState(false);

  // 重置表单
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        setFormData({
          name: category.name,
          description: category.description || '',
          icon: category.icon || 'Folder',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: 'Folder',
        });
      }
    }
  }, [open, mode, category]);

  const generateCategoryId = (name: string): string => {
    const baseId = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // 确保ID唯一
    let id = baseId;
    let counter = 1;
    
    const allCategories = flattenCategories(categories);
    while (allCategories.some(cat => cat.id === id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    
    return id;
  };

  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children) {
        result.push(...flattenCategories(cat.children));
      }
    });
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'edit' && category) {
        // 编辑现有分类
        const updatedCategories = updateCategoryInTree(categories, category.id, {
          ...category,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          icon: formData.icon,
        });
        setCategories(updatedCategories);
      } else {
        // 创建新分类
        const newCategory: Category = {
          id: generateCategoryId(formData.name),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          icon: formData.icon,
          reportCount: 0,
          parentId: mode === 'createSub' ? parentId : undefined,
        };

        if (mode === 'createSub' && parentId) {
          // 添加为子分类
          const updatedCategories = addChildCategory(categories, parentId, newCategory);
          setCategories(updatedCategories);
        } else {
          // 添加为根分类
          setCategories([...categories, newCategory]);
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategoryInTree = (cats: Category[], targetId: string, updatedCategory: Category): Category[] => {
    return cats.map(cat => {
      if (cat.id === targetId) {
        return updatedCategory;
      }
      if (cat.children) {
        return {
          ...cat,
          children: updateCategoryInTree(cat.children, targetId, updatedCategory)
        };
      }
      return cat;
    });
  };

  const addChildCategory = (cats: Category[], parentId: string, newCategory: Category): Category[] => {
    return cats.map(cat => {
      if (cat.id === parentId) {
        return {
          ...cat,
          children: [...(cat.children || []), newCategory]
        };
      }
      if (cat.children) {
        return {
          ...cat,
          children: addChildCategory(cat.children, parentId, newCategory)
        };
      }
      return cat;
    });
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'edit':
        return '编辑分类';
      case 'createSub':
        return '创建子分类';
      default:
        return '创建分类';
    }
  };

  const getParentCategoryName = () => {
    if (mode !== 'createSub' || !parentId) return '';
    
    const allCategories = flattenCategories(categories);
    const parent = allCategories.find(cat => cat.id === parentId);
    return parent?.name || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
          {mode === 'createSub' && (
            <p className="text-sm text-muted-foreground">
              将在 &ldquo;{getParentCategoryName()}&rdquo; 下创建子分类
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">分类名称 *</Label>
            <Input
              id="categoryName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入分类名称"
              required
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoryIcon">分类图标</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="选择图标" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoryDescription">分类描述</Label>
            <Textarea
              id="categoryDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入分类描述（可选）"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button 
              type="submit"
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? '保存中...' : mode === 'edit' ? '保存更改' : '创建分类'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 