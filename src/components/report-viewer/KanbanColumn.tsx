'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Report } from '@/types';
import { DraggableReportCard } from './DraggableReportCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  bgColor: string;
  reports: Report[];
  onReportClick: (report: Report) => void;
}

export function KanbanColumn({ 
  id, 
  title, 
  bgColor, 
  reports, 
  onReportClick 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full rounded-lg border border-border",
        bgColor,
        isOver && "ring-2 ring-primary ring-opacity-50"
      )}
    >
      {/* 列标题 */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">{title}</h3>
          <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
            {reports.length}
          </span>
        </div>
      </div>

      {/* 报告列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <SortableContext 
          items={reports.map(r => r.id)} 
          strategy={verticalListSortingStrategy}
        >
          {reports.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              {id === 'unread' && '暂无新报告'}
              {id === 'reading' && '暂无正在阅读的报告'}
              {id === 'completed' && '暂无已完成的报告'}
            </div>
          ) : (
            reports.map((report) => (
              <DraggableReportCard
                key={report.id}
                report={report}
                onReportClick={onReportClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
} 