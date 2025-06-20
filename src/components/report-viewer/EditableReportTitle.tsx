'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableReportTitleProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  className?: string;
}

export function EditableReportTitle({ 
  title, 
  onTitleChange, 
  className 
}: EditableReportTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(title);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== title) {
      onTitleChange(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn("h-auto py-1 px-2 text-sm font-medium bg-background border-primary", className)}
        onClick={(e) => e.stopPropagation()}
        data-editable-title
      />
    );
  }

  return (
    <h4 
      className={cn("text-sm font-medium line-clamp-2 flex-1 pr-2 cursor-pointer hover:bg-muted/30 p-1 rounded", className)}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => e.stopPropagation()}
      title="双击编辑标题"
      data-editable-title
    >
      {title}
    </h4>
  );
} 