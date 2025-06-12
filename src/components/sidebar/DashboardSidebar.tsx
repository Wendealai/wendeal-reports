'use client';

import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { CategoryTree } from './CategoryTree';
import { ReportList } from './ReportList';
import { useAppStore } from '@/store/useAppStore';
import { File, Star, Clock } from 'lucide-react';

export function DashboardSidebar() {
  const { selectedCategory, setSelectedCategory } = useAppStore();

  const quickActions = [
    { id: 'favorites', label: '收藏夹', icon: Star },
    { id: 'recent', label: '最近查看', icon: Clock },
    { id: 'all', label: '所有报告', icon: File },
  ];

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="px-4 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          报告分类
        </h2>
      </SidebarHeader>
      
      <SidebarContent>
        {/* 快速操作 */}
        <div className="px-2 py-2">
          <SidebarMenu>
            {quickActions.map((action) => (
              <SidebarMenuItem key={action.id}>
                <SidebarMenuButton
                  onClick={() => setSelectedCategory(action.id)}
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

        {/* 分类树 */}
        <div className="px-2 py-2 border-t border-border">
          <h3 className="text-sm font-medium text-sidebar-foreground px-2 py-2">
            按分类浏览
          </h3>
          <CategoryTree />
        </div>

        {/* 报告列表 */}
        {selectedCategory && (
          <div className="flex-1 border-t border-border">
            <ReportList categoryId={selectedCategory} />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}