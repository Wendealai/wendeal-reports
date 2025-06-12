'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  X, 
  Check, 
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CategorySelector } from './CategorySelector';

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  preview?: string;
  categoryId?: string;
}

interface FileUploadProps {
  onUploadComplete?: () => void;
  className?: string;
}

export function FileUpload({ onUploadComplete, className }: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState('uncategorized');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addReport } = useAppStore();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!file.type.includes('text/html') && !file.name.endsWith('.html')) {
      return '只支持 HTML 文件';
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return '文件大小不能超过 10MB';
    }
    return null;
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, 'UTF-8');
    });
  };

  const extractMetadata = (content: string, filename: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // 提取标题
    const titleElement = doc.querySelector('title');
    const h1Element = doc.querySelector('h1');
    const title = titleElement?.textContent || h1Element?.textContent || filename.replace('.html', '');
    
    // 提取描述
    const metaDescription = doc.querySelector('meta[name="description"]');
    const firstP = doc.querySelector('p');
    const description = metaDescription?.getAttribute('content') || firstP?.textContent?.slice(0, 200) || '';
    
    // 计算字数
    const textContent = doc.body?.textContent || '';
    const wordCount = textContent.replace(/\s+/g, '').length;
    
    // 提取关键词作为标签
    const metaKeywords = doc.querySelector('meta[name="keywords"]');
    const tags = metaKeywords?.getAttribute('content')?.split(',').map(tag => tag.trim()) || [];
    
    return {
      title: title.trim(),
      description: description.trim(),
      wordCount,
      tags: tags.filter(Boolean).slice(0, 5) // 最多5个标签
    };
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
             newFiles.push({
         id: generateId(),
         file,
         name: file.name,
         size: file.size,
         status: error ? 'error' : 'pending',
         progress: 0,
         error: error || undefined,
         categoryId: defaultCategory
       });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  }, [defaultCategory]);

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // 更新状态为上传中
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 20 }
          : f
      ));

      // 读取文件内容
      const content = await readFileContent(uploadFile.file);
      
      // 更新进度
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 60 }
          : f
      ));

      // 提取元数据
      const metadata = extractMetadata(content, uploadFile.name);
      
      // 更新进度
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 80 }
          : f
      ));

      // 创建新的报告对象
      const newReport = {
        id: generateId(),
        title: metadata.title,
        description: metadata.description,
        category: uploadFile.categoryId || 'uncategorized',
        tags: metadata.tags,
        content,
        filePath: `data:text/html;charset=utf-8,${encodeURIComponent(content)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: false,
        readStatus: 'unread' as const,
        fileSize: uploadFile.size,
        wordCount: metadata.wordCount
      };

      // 添加到报告列表
      addReport(newReport);

      // 更新状态为成功
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : '上传失败'
            }
          : f
      ));
    }
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
    
    setIsUploading(false);
    onUploadComplete?.();
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const updateFileCategory = (fileId: string, categoryId: string) => {
    // 防止"创建新分类"被设置为实际分类
    if (categoryId === '__create_new__') return;
    
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, categoryId } : f
    ));
  };

  const updateAllFilesCategory = (categoryId: string) => {
    // 防止"创建新分类"被设置为实际分类
    if (categoryId === '__create_new__') return;
    
    setFiles(prev => prev.map(f => ({ ...f, categoryId })));
    setDefaultCategory(categoryId);
  };

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      processFiles(selectedFiles);
    }
    // 重置input以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          上传报告文件
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 默认分类选择 */}
        <div className="space-y-2">
          <Label>默认分类</Label>
          <CategorySelector
            value={defaultCategory}
            onValueChange={updateAllFilesCategory}
            placeholder="选择文件归档分类"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            新上传的文件将自动归类到所选分类，您也可以为每个文件单独设置分类。
          </p>
        </div>

        {/* 上传区域 */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              拖拽 HTML 文件到这里，或者
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <File className="h-4 w-4 mr-2" />
              选择文件
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            支持 .html 文件，最大 10MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".html,text/html"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">待上传文件 ({files.length})</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={isUploading}
                >
                  清空
                </Button>
                <Button
                  size="sm"
                  onClick={handleUploadAll}
                  disabled={isUploading || files.every(f => f.status !== 'pending')}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      上传全部
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon(file.status)}
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <Badge variant={
                        file.status === 'success' ? 'default' :
                        file.status === 'error' ? 'destructive' :
                        file.status === 'uploading' ? 'secondary' : 'outline'
                      }>
                        {file.status === 'pending' && '待上传'}
                        {file.status === 'uploading' && '上传中'}
                        {file.status === 'success' && '已完成'}
                        {file.status === 'error' && '失败'}
                      </Badge>
                    </div>

                    {/* 分类选择器 */}
                    {file.status === 'pending' && (
                      <CategorySelector
                        value={file.categoryId}
                        onValueChange={(categoryId) => updateFileCategory(file.id, categoryId)}
                        placeholder="选择分类"
                        className="w-full text-xs"
                      />
                    )}
                    
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-1 h-1" />
                    )}
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 