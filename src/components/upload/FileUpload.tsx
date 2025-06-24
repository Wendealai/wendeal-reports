'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, 
  File as FileIcon,
  X, 
  Check, 
  AlertCircle,
  FileText,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Report } from '@/types';

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'retrying';
  progress: number;
  error?: string;
  preview?: string;
  categoryId?: string;
  uploadedBytes?: number;
  totalBytes?: number;
  startTime?: number;
  estimatedTimeRemaining?: number;
  retryCount?: number;
  uploadSpeed?: number;
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
  const [availableCategories, setAvailableCategories] = useState<Array<{id: string, label: string}>>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [batchSettings, setBatchSettings] = useState({
    maxConcurrent: 3,
    pauseOnError: false,
    autoRetry: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('FileUpload component rendered!', { files: files.length, isUploading, isDragOver });

  // 获取可用的分类列表
  useEffect(() => {
    const updateAvailableCategories = () => {
      // 基础预定义分类
      const baseCategories = [
        { id: 'uncategorized', label: '📁 未分类' },
        { id: 'tech-research', label: '💻 技术研究' },
        { id: 'market-analysis', label: '📊 市场分析' },
        { id: 'product-review', label: '🔍 产品评测' },
        { id: 'industry-insights', label: '🔬 行业洞察' }
      ];

      // 从localStorage获取预定义分类名称
      const predefinedNames = JSON.parse(localStorage.getItem('predefined_category_names') || '{}');
      const updatedBaseCategories = baseCategories.map(cat => ({
        ...cat,
        label: predefinedNames[cat.id] || cat.label
      }));

      // 从localStorage获取自定义分类
      const customCategories = JSON.parse(localStorage.getItem('custom_categories') || '[]');
      const formattedCustomCategories = customCategories.map((cat: any) => ({
        id: cat.id,
        label: cat.label
      }));

      // 获取隐藏的分类
      const hiddenCategories = JSON.parse(localStorage.getItem('hidden_categories') || '[]');
      
      // 过滤掉隐藏的分类
      const visibleBaseCategories = updatedBaseCategories.filter(cat => !hiddenCategories.includes(cat.id));
      
      // 合并所有分类
      const allCategories = [...visibleBaseCategories, ...formattedCustomCategories];
      
      console.log('📁 Upload - Available categories:', allCategories);
      setAvailableCategories(allCategories);
    };

    // 初始加载
    updateAvailableCategories();

    // 监听localStorage变化
    const handleStorageChange = () => {
      updateAvailableCategories();
    };

    // 监听自定义事件
    const handleCategoryChange = () => {
      updateAvailableCategories();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('categoryOrderChanged', handleCategoryChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categoryOrderChanged', handleCategoryChange);
    };
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    // 文件大小检查
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return `文件大小 ${(file.size / 1024 / 1024).toFixed(2)}MB 超过限制 10MB`;
    }

    // 文件类型检查
    const allowedTypes = ['text/html', 'application/xhtml+xml'];
    const allowedExtensions = ['.html', '.htm', '.xhtml'];

    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isValidExtension = allowedExtensions.includes(extension);
    const isValidMimeType = allowedTypes.some(type => file.type === type || file.type.includes('html'));

    if (!isValidExtension) {
      return `不支持的文件扩展名 ${extension}。支持的格式: ${allowedExtensions.join(', ')}`;
    }

    if (!isValidMimeType && file.type) {
      return `不支持的文件类型 ${file.type}。支持的类型: ${allowedTypes.join(', ')}`;
    }

    // 文件名检查
    if (file.name.length > 255) {
      return '文件名过长，请使用较短的文件名';
    }

    // 检查文件名中的特殊字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
      return '文件名包含无效字符，请重命名后重试';
    }

    return null;
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    console.log('processFiles called with:', fileList.length, 'files');
    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      console.log('Processing file:', file.name, file.type, file.size);
      const error = validateFile(file);
      
      if (error) {
        console.log('File validation error:', error);
      }
      
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
    
    console.log('Adding files to state:', newFiles);
    setFiles(prev => [...prev, ...newFiles]);
  }, [defaultCategory]);

  const uploadFile = async (uploadFile: UploadFile, retryCount = 0) => {
    const startTime = Date.now();

    try {
      console.log('Starting upload for file:', uploadFile.name, 'Retry:', retryCount);

      // Initialize upload state with timing info
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: retryCount > 0 ? 'retrying' : 'uploading',
              progress: 0,
              startTime,
              totalBytes: uploadFile.file.size,
              uploadedBytes: 0,
              retryCount,
              uploadSpeed: 0
            }
          : f
      ));

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('categoryId', uploadFile.categoryId || 'uncategorized');

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          const elapsed = Date.now() - startTime;
          const uploadSpeed = event.loaded / (elapsed / 1000); // bytes per second
          const remainingBytes = event.total - event.loaded;
          const estimatedTimeRemaining = remainingBytes / uploadSpeed;

          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  progress,
                  uploadedBytes: event.loaded,
                  uploadSpeed,
                  estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : 0
                }
              : f
          ));
        }
      });

      // Handle upload completion
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          console.log('📡 XHR Response received:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseLength: xhr.responseText.length,
            responsePreview: xhr.responseText.substring(0, 200)
          });

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              console.log('✅ Upload successful, parsed result:', result);
              resolve(result);
            } catch (e) {
              console.error('❌ Failed to parse response as JSON:', e);
              console.error('Response text:', xhr.responseText);
              reject(new Error('Invalid response format'));
            }
          } else {
            console.error('❌ HTTP error response:', xhr.status, xhr.statusText);
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `HTTP ${xhr.status}: 上传失败`));
            } catch (e) {
              reject(new Error(`HTTP ${xhr.status}: 上传失败`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.ontimeout = () => reject(new Error('上传超时'));

        xhr.open('POST', '/api/reports');
        xhr.timeout = 300000; // 5 minutes timeout
        xhr.send(formData);
      });

      const result = await uploadPromise;

      console.log('Report created on server:', result.report);

      if (result.report) {
        useAppStore.setState((state) => ({ reports: [result.report, ...state.reports] }));
      }

      window.dispatchEvent(new CustomEvent('forceReportUpdate'));

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'success',
              progress: 100,
              estimatedTimeRemaining: 0
            }
          : f
      ));

      console.log('Upload completed successfully for:', uploadFile.name);

    } catch (error) {
      console.error('Upload file error:', error);

      // Implement retry logic for network errors
      const isRetryableError = error instanceof Error && (
        error.message.includes('网络错误') ||
        error.message.includes('上传超时') ||
        error.message.includes('fetch')
      );

      if (isRetryableError && retryCount < 3) {
        console.log(`Retrying upload for ${uploadFile.name}, attempt ${retryCount + 1}`);

        // Wait before retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));

        return uploadFile(uploadFile, retryCount + 1);
      }

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'error',
              error: error instanceof Error ? error.message : '上传失败',
              estimatedTimeRemaining: 0
            }
          : f
      ));
    }
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    setIsProcessingQueue(true);

    const pendingFiles = files.filter(f => f.status === 'pending');
    setUploadQueue(pendingFiles);

    await processBatchUpload(pendingFiles);

    setIsUploading(false);
    setIsProcessingQueue(false);
    setUploadQueue([]);
    onUploadComplete?.();
  };

  const processBatchUpload = async (filesToUpload: UploadFile[]) => {
    const { maxConcurrent, pauseOnError, autoRetry } = batchSettings;
    const chunks = [];

    // Split files into chunks for concurrent processing
    for (let i = 0; i < filesToUpload.length; i += maxConcurrent) {
      chunks.push(filesToUpload.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      const uploadPromises = chunk.map(async (file) => {
        try {
          await uploadFile(file, 0);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);

          if (pauseOnError) {
            throw error; // Stop processing if pauseOnError is true
          }

          if (autoRetry) {
            // Add to retry queue
            setTimeout(() => {
              retryFile(file.id);
            }, 2000);
          }
        }
      });

      try {
        await Promise.all(uploadPromises);
      } catch (error) {
        if (pauseOnError) {
          console.error('Batch upload paused due to error:', error);
          break;
        }
      }
    }
  };

  const pauseUpload = () => {
    setIsProcessingQueue(false);
    // Cancel ongoing uploads would require more complex state management
  };

  const resumeUpload = () => {
    const remainingFiles = files.filter(f => f.status === 'pending');
    if (remainingFiles.length > 0) {
      setIsProcessingQueue(true);
      processBatchUpload(remainingFiles);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (file && file.status === 'error') {
      await uploadFile(file, 0);
    }
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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const error = validateFile(file);
      if (error) {
        console.error(`File ${file.name} validation failed:`, error);
        return false;
      }
      return true;
    });

    const uploadFiles = validFiles.map(file => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      progress: 0,
      categoryId: defaultCategory
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  }, [defaultCategory]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    console.log('Files selected:', selectedFiles.length);
    
    const validFiles = selectedFiles.filter(file => {
      const error = validateFile(file);
      if (error) {
        alert(`文件 ${file.name} 验证失败: ${error}`);
        return false;
      }
      return true;
    });

    const uploadFiles = validFiles.map(file => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      progress: 0,
      categoryId: defaultCategory
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
    
    // 重置输入框
    if (e.target) e.target.value = '';
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
      case 'uploading':
        return <Loader2 style={{ width: '16px', height: '16px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />;
      case 'retrying':
        return <Loader2 style={{ width: '16px', height: '16px', color: '#f59e0b', animation: 'spin 1s linear infinite' }} />;
      case 'success':
        return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'error':
        return <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
    return `${Math.round(seconds / 3600)}小时`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 默认分类选择 */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '8px',
          color: '#374151'
        }}>
          默认分类
        </label>
        <select
          value={defaultCategory}
          onChange={(e) => updateAllFilesCategory(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            color: '#374151',
            cursor: 'pointer'
          }}
        >
          {availableCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        <p style={{ 
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '4px',
          margin: '4px 0 0 0'
        }}>
          新上传的文件将自动归类到所选分类，您也可以为每个文件单独设置分类。
        </p>
      </div>

      {/* 上传区域 */}
      <div
        style={{
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
          transition: 'all 0.2s',
          backgroundColor: isDragOver ? '#f0f9ff' : '#fafafa',
          borderColor: isDragOver ? '#3b82f6' : '#d1d5db',
          cursor: 'pointer'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload style={{ 
          width: '48px', 
          height: '48px', 
          margin: '0 auto 16px auto',
          color: '#6b7280'
        }} />
        <div style={{ marginBottom: '16px' }}>
          <p style={{ 
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#111827'
          }}>
            拖拽 HTML 文件到这里，或者
          </p>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onClick={() => {
              console.log('File select button clicked!');
              console.log('fileInputRef.current:', fileInputRef.current);
              fileInputRef.current?.click();
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
              (e.target as HTMLElement).style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#ffffff';
              (e.target as HTMLElement).style.borderColor = '#d1d5db';
            }}
          >
            <FileIcon style={{ width: '16px', height: '16px' }} />
            选择文件
          </button>
        </div>
        <p style={{ 
          fontSize: '14px',
          color: '#6b7280',
          margin: '0'
        }}>
          仅支持 .html 文件，最大 10MB
        </p>
      </div>

              <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".html,text/html"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* 文件列表 */}
      {files.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: '500',
              margin: '0',
              color: '#111827'
            }}>
              待上传文件 ({files.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#374151',
                  cursor: 'pointer'
                }}
                onClick={clearAll}
                disabled={isUploading}
              >
                清空
              </button>

              {/* Batch Settings */}
              <select
                value={batchSettings.maxConcurrent}
                onChange={(e) => setBatchSettings(prev => ({ ...prev, maxConcurrent: parseInt(e.target.value) }))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  color: '#374151'
                }}
                disabled={isUploading}
              >
                <option value={1}>单个上传</option>
                <option value={2}>并发2个</option>
                <option value={3}>并发3个</option>
                <option value={5}>并发5个</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={batchSettings.autoRetry}
                  onChange={(e) => setBatchSettings(prev => ({ ...prev, autoRetry: e.target.checked }))}
                  disabled={isUploading}
                />
                自动重试
              </label>

              {isProcessingQueue && (
                <button
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f59e0b',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onClick={pauseUpload}
                >
                  暂停
                </button>
              )}

              <button
                style={{
                  padding: '6px 12px',
                  backgroundColor: isUploading || files.every(f => f.status !== 'pending') ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'white',
                  cursor: isUploading || files.every(f => f.status !== 'pending') ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={handleUploadAll}
                disabled={isUploading || files.every(f => f.status !== 'pending')}
              >
                {isUploading ? (
                  <>
                    <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    批量上传中... ({files.filter(f => f.status === 'success').length}/{files.length})
                  </>
                ) : (
                  <>
                    <Upload style={{ width: '14px', height: '14px' }} />
                    批量上传 ({files.filter(f => f.status === 'pending').length}个)
                  </>
                )}
              </button>
            </div>
          </div>

          <div style={{ 
            maxHeight: '240px',
            overflow: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            {files.map((file, index) => (
              <div key={file.id} style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderBottom: index < files.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                {getStatusIcon(file.status)}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: '0 0 4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#111827'
                  }}>
                    {file.name}
                  </p>
                  
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '8px'
                  }}>
                    <span>{formatFileSize(file.size)}</span>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor:
                        file.status === 'success' ? '#dcfce7' :
                        file.status === 'error' ? '#fef2f2' :
                        file.status === 'uploading' ? '#f0f9ff' :
                        file.status === 'retrying' ? '#fef3c7' : '#f9fafb',
                      color:
                        file.status === 'success' ? '#166534' :
                        file.status === 'error' ? '#dc2626' :
                        file.status === 'uploading' ? '#1d4ed8' :
                        file.status === 'retrying' ? '#d97706' : '#374151'
                    }}>
                      {file.status === 'pending' && '待上传'}
                      {file.status === 'uploading' && `上传中 ${file.progress}%`}
                      {file.status === 'retrying' && `重试中 ${file.retryCount ? `(${file.retryCount}/3)` : ''}`}
                      {file.status === 'success' && '已完成'}
                      {file.status === 'error' && '失败'}
                    </span>

                    {/* Upload speed and time remaining */}
                    {(file.status === 'uploading' || file.status === 'retrying') && file.uploadSpeed && (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {formatSpeed(file.uploadSpeed)}
                        {file.estimatedTimeRemaining && file.estimatedTimeRemaining > 1 && (
                          <> • 剩余 {formatTime(file.estimatedTimeRemaining)}</>
                        )}
                      </span>
                    )}
                  </div>

                  {/* 分类选择器 */}
                  {file.status === 'pending' && (
                    <select
                      value={file.categoryId}
                      onChange={(e) => updateFileCategory(file.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {availableCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {(file.status === 'uploading' || file.status === 'retrying') && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {file.uploadedBytes && file.totalBytes ?
                            `${formatFileSize(file.uploadedBytes)} / ${formatFileSize(file.totalBytes)}` :
                            `${file.progress}%`
                          }
                        </span>
                        {file.status === 'retrying' && (
                          <span style={{ fontSize: '11px', color: '#d97706' }}>
                            重试 {file.retryCount || 0}/3
                          </span>
                        )}
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${file.progress}%`,
                          height: '100%',
                          backgroundColor: file.status === 'retrying' ? '#f59e0b' : '#3b82f6',
                          transition: 'width 0.3s ease-in-out',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  )}
                  {file.error && (
                    <div style={{ marginTop: '8px' }}>
                      <p style={{
                        fontSize: '12px',
                        color: '#dc2626',
                        margin: '0 0 8px 0'
                      }}>
                        {file.error}
                      </p>
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => retryFile(file.id)}
                      >
                        <Loader2 style={{ width: '12px', height: '12px' }} />
                        重试上传
                      </button>
                    </div>
                  )}
                </div>

                <button
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: file.status === 'uploading' ? 'not-allowed' : 'pointer',
                    color: '#6b7280'
                  }}
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === 'uploading'}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 