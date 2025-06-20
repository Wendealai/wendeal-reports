'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Category } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

interface CategoryItemProps {
  category: Category;
  level?: number;
}

function CategoryItem({ category, level = 0 }: CategoryItemProps) {
  const { selectedCategory, setSelectedCategory } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  const handleClick = () => {
    setSelectedCategory(category.id);
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleClick}
          isActive={selectedCategory === category.id}
          className="w-full justify-start"
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          <span className="flex-1 text-left">
            {category.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {category.reportCount}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree() {
  const { categories } = useAppStore();

  return (
    <SidebarMenu>
      {categories.map((category) => (
        <CategoryItem key={category.id} category={category} />
      ))}
    </SidebarMenu>
  );
} 