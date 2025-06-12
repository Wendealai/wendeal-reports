'use client';

import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { DraggableCategoryTree } from './DraggableCategoryTree';
import { CategoryToolbar } from './CategoryToolbar';
import { useAppStore } from '@/store/useAppStore';
import { File, Star, Clock } from 'lucide-react';

export function DashboardSidebar() {
  const { selectedCategory, setSelectedCategory, categories, setSelectedReport } = useAppStore();

  const quickActions = [
    { id: 'favorites', label: '收藏夹', icon: Star },
    { id: 'recent', label: '最近查看', icon: Clock },
    { id: 'all', label: '所有报告', icon: File },
  ];

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="px-4 py-4 border-b border-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          Wendeal Reports
        </h1>
      </SidebarHeader>
      
      <SidebarContent>
        {/* 快速操作 */}
        <div className="px-2 py-2">
          <SidebarMenu>
            {quickActions.map((action) => (
              <SidebarMenuItem key={action.id}>
                <SidebarMenuButton
                  onClick={() => {
                    setSelectedCategory(action.id);
                    setSelectedReport(null); // 清除选中的报告
                  }}
                  isActive={selectedCategory === action.id}
                  className="w-full justify-start"
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        {/* 分类管理 */}
        <div className="border-t border-border">
          <CategoryToolbar />
          <div className="px-2 py-2">
            <DraggableCategoryTree categories={categories} />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}