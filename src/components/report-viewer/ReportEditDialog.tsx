'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Report, Category } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

interface ReportEditDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportEditDialog({ report, open, onOpenChange }: ReportEditDialogProps) {
  const { updateReport, categories } = useAppStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  // 当报告变化时更新表单数据
  useEffect(() => {
    if (report) {
      setFormData({
        title: report.title,
        description: report.description || '',
        category: report.category,
        tags: [...report.tags],
      });
    }
  }, [report]);

  // 获取扁平化的分类列表
  const getFlatCategories = (categories: Category[]): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];
    
    const traverse = (cats: Category[], level = 0) => {
      for (const cat of cats) {
        result.push({
          id: cat.id,
          name: cat.name,
          level,
        });
        if (cat.children) {
          traverse(cat.children, level + 1);
        }
      }
    };
    
    traverse(categories);
    return result;
  };

  const flatCategories = getFlatCategories(categories);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    updateReport(report.id, {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      tags: formData.tags,
    });

    onOpenChange(false);
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑报告信息</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="报告标题"
              required
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="报告描述（可选）"
              rows={3}
            />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">未分类</SelectItem>
                {flatCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span style={{ paddingLeft: `${cat.level * 16}px` }}>
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <Label>标签</Label>
            
            {/* 已有标签 */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* 添加新标签 */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="添加标签"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">
              保存更改
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 