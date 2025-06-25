"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAppStore } from "@/store/useAppStore";
import { Report } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { DraggableReportCard } from "./DraggableReportCard";

interface KanbanBoardProps {
  reports: Report[];
  onReportClick: (report: Report) => void;
}

const STATUS_COLUMNS = [
  { id: "unread", title: "未阅读", bgColor: "bg-slate-50 dark:bg-slate-900" },
  {
    id: "reading",
    title: "阅读中",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  {
    id: "completed",
    title: "已阅读",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
] as const;

export function KanbanBoard({ reports, onReportClick }: KanbanBoardProps) {
  const { updateReport } = useAppStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // 按状态分组报告
  const reportsByStatus = {
    unread: reports.filter((report) => report.readStatus === "unread"),
    reading: reports.filter((report) => report.readStatus === "reading"),
    completed: reports.filter((report) => report.readStatus === "completed"),
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    // 如果没有放在有效位置，保持原状态
    if (!over) {
      return;
    }

    const reportId = active.id as string;
    const newStatus = over.id as Report["readStatus"];

    // 验证是否是有效的状态列
    const validStatuses = ["unread", "reading", "completed"];
    if (!validStatuses.includes(newStatus)) {
      return;
    }

    // 如果状态没有改变，不需要更新
    const currentReport = reports.find((r) => r.id === reportId);
    if (!currentReport || currentReport.readStatus === newStatus) {
      return;
    }

    // 更新报告状态
    updateReport(reportId, {
      readStatus: newStatus,
      updatedAt: new Date(),
    });
  };

  const activeReport = activeId ? reports.find((r) => r.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-hidden">
        <div className="grid grid-cols-3 gap-6 h-full p-6">
          {STATUS_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              bgColor={column.bgColor}
              reports={
                reportsByStatus[column.id as keyof typeof reportsByStatus]
              }
              onReportClick={onReportClick}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeReport && (
          <div className="transform rotate-2 opacity-95">
            <DraggableReportCard
              report={activeReport}
              onReportClick={onReportClick}
              isDragging={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
