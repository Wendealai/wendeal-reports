'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ChevronDown, 
  ChevronRight, 
  Code, 
  TrendingUp, 
  BookOpen, 
  BarChart3, 
  Brain, 
  Globe, 
  FileText, 
  Folder, 
  Package,
  GripVertical,
  Plus,
  FolderPlus
} from 'lucide-react';
import { Category } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { CategoryActions } from './CategoryActions';
import { CategoryDialog } from './CategoryDialog';
import { Button } from '@/components/ui/button';

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

interface DraggableCategoryTreeProps {
  categories: Category[];
}

export function DraggableCategoryTree({ categories }: DraggableCategoryTreeProps) {
  const { 
    selectedCategory, 
    setSelectedCategory, 
    updateCategoryName, 
    setSelectedReport, 
    reports,
    setCategories
  } = useAppStore();
  
  const [expandedCategories, setExpandedCategories] = useState(new Set<string>());
  const [, setActiveId] = useState<string | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'createSub';
    category?: Category;
    parentId?: string;
  }>({
    open: false,
    mode: 'create',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 扁平化分类列表用于拖拽排序
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && expandedCategories.has(cat.id)) {
        result.push(...flattenCategories(cat.children));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const category = flatCategories.find(cat => cat.id === active.id);
    setDraggedCategory(category || null);
  };

  const handleDragOver = () => {
    // 处理拖拽悬停逻辑
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedCategory(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = flatCategories.findIndex(cat => cat.id === active.id);
    const newIndex = flatCategories.findIndex(cat => cat.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(flatCategories, oldIndex, newIndex);
      
      // 重构树形结构
      const newCategoryTree = buildTreeFromFlat(newOrder);
      setCategories(newCategoryTree);
    }
  };

  // 从扁平列表重建树形结构
  const buildTreeFromFlat = (flatList: Category[]): Category[] => {
    const tree: Category[] = [];
    const lookup: { [id: string]: Category } = {};

    // 创建查找表
    flatList.forEach(cat => {
      lookup[cat.id] = { ...cat, children: [] };
    });

    // 构建树结构
    flatList.forEach(cat => {
      if (cat.parentId && lookup[cat.parentId]) {
        lookup[cat.parentId].children!.push(lookup[cat.id]);
      } else if (!cat.parentId) {
        tree.push(lookup[cat.id]);
      }
    });

    return tree;
  };

  const addSubCategory = (parentId: string) => {
    setDialogState({
      open: true,
      mode: 'createSub',
      parentId,
    });
  };

  const addRootCategory = () => {
    setDialogState({
      open: true,
      mode: 'create',
    });
  };

  const editCategory = (category: Category) => {
    setDialogState({
      open: true,
      mode: 'edit',
      category,
    });
  };

  const closeDialog = () => {
    setDialogState({
      open: false,
      mode: 'create',
    });
  };

  return (
    <div className="space-y-2">
      {/* 添加根分类按钮 */}
      <Button
        variant="ghost" 
        size="sm"
        onClick={addRootCategory}
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        添加分类
      </Button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={flatCategories.map(cat => cat.id)} strategy={verticalListSortingStrategy}>
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

            {/* 可拖拽分类列表 */}
            {categories.map((category) => (
              <DraggableCategoryNode
                key={category.id}
                category={category}
                selectedCategory={selectedCategory}
                expandedCategories={expandedCategories}
                level={0}
                onCategorySelect={(categoryId) => {
                  setSelectedCategory(categoryId);
                  setSelectedReport(null);
                }}
                onCategoryToggle={toggleCategory}
                onCategoryNameChange={updateCategoryName}
                onAddSubCategory={addSubCategory}
                onEditCategory={editCategory}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {draggedCategory && (
            <div className="bg-card border rounded-lg shadow-lg opacity-95">
              <CategoryDisplayNode category={draggedCategory} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 分类创建/编辑对话框 */}
      <CategoryDialog
        open={dialogState.open}
        onOpenChange={closeDialog}
        mode={dialogState.mode}
        category={dialogState.category}
        parentId={dialogState.parentId}
      />
    </div>
  );
}

// 可拖拽的分类节点
interface DraggableCategoryNodeProps {
  category: Category;
  selectedCategory: string | null;
  expandedCategories: Set<string>;
  level: number;
  onCategorySelect: (categoryId: string) => void;
  onCategoryToggle: (categoryId: string) => void;
  onCategoryNameChange: (categoryId: string, newName: string) => void;
  onAddSubCategory: (parentId: string) => void;
  onEditCategory: (category: Category) => void;
}

function DraggableCategoryNode({
  category,
  selectedCategory,
  expandedCategories,
  level,
  onCategorySelect,
  onCategoryToggle,
  onCategoryNameChange,
  onAddSubCategory,
  onEditCategory,
}: DraggableCategoryNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-30")}>
      <div
        className={cn(
          "group flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors",
          "hover:bg-muted/60",
          isSelected && "bg-primary/10 border border-primary/20"
        )}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* 拖拽手柄 */}
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>

          {/* 展开/收起按钮 */}
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
          
          {/* 分类图标 */}
          {React.createElement(
            iconMap[category.icon as keyof typeof iconMap] || Folder, 
            { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }
          )}
          
          <span className="text-sm font-medium truncate flex-1">
            {category.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {category.reportCount || 0}
          </span>
          
          {/* 添加子分类按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubCategory(category.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
          >
            <FolderPlus className="h-3 w-3" />
          </Button>
          
          <CategoryActions 
            category={category} 
            onRename={onCategoryNameChange}
          />
        </div>
      </div>

      {/* 子分类 */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {category.children!.map((child) => (
            <DraggableCategoryNode
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              expandedCategories={expandedCategories}
              level={level + 1}
              onCategorySelect={onCategorySelect}
              onCategoryToggle={onCategoryToggle}
              onCategoryNameChange={onCategoryNameChange}
              onAddSubCategory={onAddSubCategory}
              onEditCategory={onEditCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 显示用的分类节点（用于拖拽覆盖层）
interface CategoryDisplayNodeProps {
  category: Category;
  isDragging?: boolean;
}

function CategoryDisplayNode({ category, isDragging }: CategoryDisplayNodeProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 py-2 px-3 rounded-lg",
      isDragging && "bg-card border"
    )}>
      <GripVertical className="h-3 w-3 text-muted-foreground" />
      
      {React.createElement(
        iconMap[category.icon as keyof typeof iconMap] || Folder, 
        { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }
      )}
      
      <span className="text-sm font-medium">
        {category.name}
      </span>
      
      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-auto">
        {category.reportCount || 0}
      </span>
    </div>
  );
} 