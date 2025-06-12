'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Report } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  FileText,
  Tag,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { ReportCardActions } from './ReportCardActions';

interface DraggableReportCardProps {
  report: Report;
  onReportClick: (report: Report) => void;
  isDragging?: boolean;
}

export function DraggableReportCard({ 
  report, 
  onReportClick,
  isDragging = false 
}: DraggableReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedReports, setSelectedReports, batchMode } = useAppStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: report.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const isSelected = selectedReports.includes(report.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // 防止在拖拽时触发点击
    if (isSortableDragging || isDragging) return;
    
    // 如果点击的是展开按钮或设置按钮区域，不触发报告查看
    if ((e.target as HTMLElement).closest('[data-action-button]')) {
      return;
    }
    
    // 如果是批量模式，处理选择逻辑
    if (batchMode) {
      handleToggleSelect();
      return;
    }
    
    onReportClick(report);
  };

  const handleToggleSelect = () => {
    if (isSelected) {
      setSelectedReports(selectedReports.filter(id => id !== report.id));
    } else {
      setSelectedReports([...selectedReports, report.id]);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border border-border relative",
        (isSortableDragging || isDragging) && "opacity-50 shadow-lg",
        isSelected && "ring-2 ring-blue-500 border-blue-500",
        "select-none"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3">
        {/* 批量选择模式指示器 */}
        {batchMode && (
          <div className="absolute top-2 left-2 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelect();
              }}
              data-action-button
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* 标题和操作按钮 */}
        <div className="flex items-start justify-between mb-2">
          <h4 className={cn(
            "text-sm font-medium line-clamp-2 flex-1 pr-2",
            batchMode && "ml-8" // 为复选框留出空间
          )}>
            {report.title}
          </h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            {report.isFavorite && (
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleExpandClick}
              data-action-button
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <ReportCardActions report={report} />
          </div>
        </div>

        {/* 展开的详细信息 */}
        {isExpanded && (
          <div className="space-y-2 pt-2 border-t border-border">
            {/* 描述 */}
            {report.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">
                {report.description}
              </p>
            )}
            
            {/* 日期信息 */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(report.createdAt)}</span>
              </div>
              {report.wordCount && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{report.wordCount.toLocaleString()} 字</span>
                </div>
              )}
            </div>

            {/* 标签 */}
            {report.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1 flex-1">
                  {report.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-1 py-0 h-auto">
                      {tag}
                    </Badge>
                  ))}
                  {report.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1 py-0 h-auto">
                      +{report.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 简化的状态指示器（非展开状态下显示） */}
        {!isExpanded && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {report.tags.length > 0 && (
                <div className="flex gap-1">
                  {report.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-1 py-0 h-auto">
                      {tag}
                    </Badge>
                  ))}
                  {report.tags.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{report.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(report.createdAt)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 