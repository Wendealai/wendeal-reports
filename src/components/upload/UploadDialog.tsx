'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileUpload } from './FileUpload';
import { Upload } from 'lucide-react';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleUploadComplete = () => {
    setUploadComplete(true);
    // 延迟关闭对话框，让用户看到成功状态
    setTimeout(() => {
      setUploadComplete(false);
      onOpenChange(false);
    }, 1500);
  };

  const handleClose = () => {
    if (!uploadComplete) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            上传报告文件
          </DialogTitle>
          <DialogDescription>
            选择或拖拽 HTML 文件来添加新的研究报告。系统会自动提取文件的标题、描述和标签信息。
          </DialogDescription>
        </DialogHeader>

        <FileUpload 
          onUploadComplete={handleUploadComplete}
          className="border-0 shadow-none"
        />

        {uploadComplete && (
          <div className="text-center py-4">
            <div className="text-green-600 font-medium">
              ✅ 文件上传成功！正在关闭对话框...
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 