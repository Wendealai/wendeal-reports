'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Report } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, AlertTriangle } from 'lucide-react';

interface FileReplaceDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileReplaceDialog({ report, open, onOpenChange }: FileReplaceDialogProps) {
  const { replaceReportFile } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileReplace = async (filePath: string, fileSize?: number, wordCount?: number) => {
    if (!report) return;
    
    setIsUploading(true);
    
    try {
      replaceReportFile(report.id, filePath, fileSize, wordCount);
      setUploadComplete(true);
      
      // 延迟关闭对话框
      setTimeout(() => {
        setUploadComplete(false);
        setIsUploading(false);
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('File replace failed:', error);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading && !uploadComplete) {
      onOpenChange(false);
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            替换报告文件
          </DialogTitle>
          <DialogDescription>
                          为报告 &ldquo;{report.title}&rdquo; 上传新的 HTML 文件。新文件将替换当前的报告内容。
          </DialogDescription>
        </DialogHeader>

        {/* 警告信息 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                注意事项
              </p>
              <ul className="text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                <li>此操作将永久替换当前的报告文件</li>
                <li>报告的标题、描述、标签等信息将保持不变</li>
                <li>只有文件内容会被更新</li>
                <li>建议在替换前备份原文件</li>
              </ul>
            </div>
          </div>
        </div>

        {uploadComplete ? (
          <div className="text-center py-8">
            <div className="text-green-600 font-medium text-lg">
              ✅ 文件替换成功！
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              正在关闭对话框...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">选择新的HTML文件</p>
              <p className="text-sm text-muted-foreground mb-4">
                点击或拖拽文件到此区域进行替换
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.html,text/html';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      // 模拟文件处理过程
                      const filePath = URL.createObjectURL(file);
                      const fileSize = file.size;
                      // 简单的字数统计
                      const reader = new FileReader();
                      reader.onload = () => {
                        const content = reader.result as string;
                        const textContent = content.replace(/<[^>]*>/g, '');
                        const wordCount = textContent.length;
                        handleFileReplace(filePath, fileSize, wordCount);
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
                disabled={isUploading}
              >
                选择文件
              </Button>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="text-center py-4">
            <div className="text-blue-600 font-medium">
              正在替换文件...
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 