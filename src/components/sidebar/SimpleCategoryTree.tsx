'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code, TrendingUp, BookOpen, BarChart3, Brain, Globe, FileText, Folder, Package } from 'lucide-react';
import { Category } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { CategoryActions } from './CategoryActions';

const iconMap = {
  Code,
  TrendingUp,
  BookOpen,
  BarChart3,
  Brain,
  Globe,
  FileText,
  Folder,
};

interface SimpleCategoryTreeProps {
  categories: Category[];
}

export function SimpleCategoryTree({ categories }: SimpleCategoryTreeProps) {
  const { selectedCategory, setSelectedCategory, updateCategoryName, setSelectedReport, reports } = useAppStore();
  const [expandedCategories, setExpandedCategories] = useState(new Set<string>());

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // 计算未分类报告数量
  const uncategorizedCount = reports.filter(report => report.category === 'uncategorized' || !report.category).length;

  return (
    <div className="space-y-1">
      {/* 未分类条目 */}
      <div
        className={cn(
          "group flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors",
          "hover:bg-muted/60",
          selectedCategory === 'uncategorized' && "bg-primary/10 border border-primary/20"
        )}
        onClick={() => {
          setSelectedCategory('uncategorized');
          setSelectedReport(null);
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-4" />
          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate flex-1">
            未分类
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {uncategorizedCount}
          </span>
        </div>
      </div>

      {/* 现有分类 */}
      {categories.map((category) => (
        <CategoryNode 
          key={category.id}
          category={category}
          selectedCategory={selectedCategory}
          expandedCategories={expandedCategories}
          onCategorySelect={(categoryId) => {
            setSelectedCategory(categoryId);
            setSelectedReport(null); // 清除选中的报告
          }}
          onCategoryToggle={toggleCategory}
          onCategoryNameChange={updateCategoryName}
        />
      ))}
    </div>
  );
}

interface CategoryNodeProps {
  category: Category;
  selectedCategory: string | null;
  expandedCategories: Set<string>;
  onCategorySelect: (categoryId: string) => void;
  onCategoryToggle: (categoryId: string) => void;
  onCategoryNameChange: (categoryId: string, newName: string) => void;
}

function CategoryNode({
  category,
  selectedCategory,
  expandedCategories,
  onCategorySelect,
  onCategoryToggle,
  onCategoryNameChange,
}: CategoryNodeProps) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedCategory === category.id;

  const handleClick = () => {
    onCategorySelect(category.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onCategoryToggle(category.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors",
          "hover:bg-muted/60",
          isSelected && "bg-primary/10 border border-primary/20"
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren && (
            <button
              onClick={handleToggle}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          {React.createElement(
            iconMap[category.icon as keyof typeof iconMap] || Code, 
            { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }
          )}
          
          <span className="text-sm font-medium truncate flex-1">
            {category.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {category.reportCount || 0}
          </span>
          <CategoryActions 
            category={category} 
            onRename={onCategoryNameChange}
          />
        </div>
      </div>

      {/* 子分类 */}
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              expandedCategories={expandedCategories}
              onCategorySelect={onCategorySelect}
              onCategoryToggle={onCategoryToggle}
              onCategoryNameChange={onCategoryNameChange}
            />
          ))}
        </div>
      )}
    </div>
  );
} 