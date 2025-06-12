'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw
} from 'lucide-react';
import { Category } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export function CategoryToolbar() {
  const { categories, setCategories, reports } = useAppStore();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');

  // 导出分类数据
  const handleExportCategories = () => {
    const exportData = {
      categories,
      exportTime: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `wendeal-categories-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导入分类数据
  const handleImportCategories = () => {
    try {
      const parsedData = JSON.parse(importData);
      
      if (parsedData.categories && Array.isArray(parsedData.categories)) {
        const mergedCategories = [...categories];
        
        // 简单合并逻辑：添加新分类，跳过重复的
        parsedData.categories.forEach((importCat: Category) => {
          const exists = findCategoryById(mergedCategories, importCat.id);
          if (!exists) {
            mergedCategories.push(importCat);
          }
        });
        
        setCategories(mergedCategories);
        setIsImportDialogOpen(false);
        setImportData('');
      } else {
        alert('导入数据格式错误');
      }
    } catch (error) {
      alert('导入数据解析失败：' + (error as Error).message);
    }
  };

  // 递归查找分类
  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 清理空分类
  const handleCleanEmptyCategories = () => {
    if (confirm('确定要删除所有空分类吗？此操作不可撤销。')) {
      const cleanCategories = (cats: Category[]): Category[] => {
        return cats.filter(cat => {
          // 先清理子分类
          if (cat.children) {
            cat.children = cleanCategories(cat.children);
          }
          
          // 如果有报告或子分类，保留
          return cat.reportCount > 0 || (cat.children && cat.children.length > 0);
        });
      };
      
      const cleanedCategories = cleanCategories(categories);
      setCategories(cleanedCategories);
    }
  };

  // 重建分类统计
  const handleRebuildStats = () => {
    // 统计每个分类的报告数量
    const calculateReportCounts = (cats: Category[]): Category[] => {
      return cats.map(cat => {
        const reportCount = reports.filter(report => report.category === cat.id).length;
        
        const updatedCat = { ...cat, reportCount };
        
        if (cat.children) {
          updatedCat.children = calculateReportCounts(cat.children);
        }
        
        return updatedCat;
      });
    };
    
    const updatedCategories = calculateReportCounts(categories);
    setCategories(updatedCategories);
  };

  return (
    <>
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        <span className="text-sm font-medium text-muted-foreground">分类管理</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExportCategories}>
              <Download className="h-4 w-4 mr-2" />
              导出分类
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              导入分类
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleRebuildStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重建统计
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleCleanEmptyCategories}>
              <Trash2 className="h-4 w-4 mr-2" />
              清理空分类
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 导入对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              导入分类数据
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="importData">JSON 数据</Label>
              <Textarea
                id="importData"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="请粘贴导出的 JSON 分类数据..."
                rows={10}
                className="font-mono text-xs"
              />
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>请确保粘贴的是从本系统导出的有效 JSON 格式分类数据。</p>
              <p>导入时会自动跳过已存在的分类，只添加新的分类。</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleImportCategories}
              disabled={!importData.trim()}
            >
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 