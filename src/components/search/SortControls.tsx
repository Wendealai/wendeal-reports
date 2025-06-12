'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SortField, SortOrder } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUp,
  ArrowDown,
  Calendar,
  FileText,
  Clock,
  Hash,
  Weight,
} from 'lucide-react';

interface SortControlsProps {
  className?: string;
}

export function SortControls({ className }: SortControlsProps) {
  const { sortOptions, setSortOptions } = useAppStore();

  const sortFields: Array<{ value: SortField; label: string; icon: React.ReactNode }> = [
    { value: 'title', label: '标题', icon: <FileText className="h-4 w-4" /> },
    { value: 'createdAt', label: '创建时间', icon: <Calendar className="h-4 w-4" /> },
    { value: 'updatedAt', label: '更新时间', icon: <Clock className="h-4 w-4" /> },
    { value: 'wordCount', label: '字数', icon: <Hash className="h-4 w-4" /> },
    { value: 'fileSize', label: '文件大小', icon: <Weight className="h-4 w-4" /> },
  ];

  const handleFieldChange = (field: SortField) => {
    setSortOptions({ ...sortOptions, field });
  };

  const toggleOrder = () => {
    const newOrder: SortOrder = sortOptions.order === 'asc' ? 'desc' : 'asc';
    setSortOptions({ ...sortOptions, order: newOrder });
  };

  const getSortIcon = () => {
    if (sortOptions.order === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    } else {
      return <ArrowDown className="h-4 w-4" />;
    }
  };

  const getCurrentFieldLabel = () => {
    const field = sortFields.find(f => f.value === sortOptions.field);
    return field?.label || '标题';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">排序:</span>
      
      {/* 排序字段选择 */}
      <Select value={sortOptions.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="选择排序字段" />
        </SelectTrigger>
        <SelectContent>
          {sortFields.map((field) => (
            <SelectItem key={field.value} value={field.value}>
              <div className="flex items-center gap-2">
                {field.icon}
                {field.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 排序方向切换 */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleOrder}
        className="gap-2"
        title={`当前: ${getCurrentFieldLabel()} ${sortOptions.order === 'asc' ? '升序' : '降序'}`}
      >
        {getSortIcon()}
        {sortOptions.order === 'asc' ? '升序' : '降序'}
      </Button>
    </div>
  );
} 