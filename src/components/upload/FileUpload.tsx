'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, 
  File, 
  X, 
  Check, 
  AlertCircle,
  FileText,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

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
  const [availableCategories, setAvailableCategories] = useState<Array<{id: string, label: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addReport } = useAppStore();

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
    
    const title = doc.querySelector('title')?.textContent || 
                  doc.querySelector('h1')?.textContent || 
                  filename.replace('.html', '');
    
    // 优先从meta标签提取描述
    let description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                     doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                     '';
    
    // 如果没有meta描述，从文档正文提取前几句话作为描述
    if (!description.trim()) {
      const bodyText = doc.body?.textContent || '';
      if (bodyText.trim()) {
        // 清理多余空白符，取前200个字符作为描述
        const cleanText = bodyText.trim().replace(/\s+/g, ' ');
        description = cleanText.length > 200 
          ? cleanText.substring(0, 200) + '...' 
          : cleanText;
      }
    }
    
    const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
    const tags = keywords ? keywords.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    const textContent = doc.body?.textContent || '';
    const wordCount = textContent.trim().split(/\s+/).length;
    
    return {
      title: title.trim(),
      description: description.trim(),
      tags,
      wordCount
    };
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

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      console.log('Starting upload for file:', uploadFile.name);
      
      // 更新状态为上传中
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 20 }
          : f
      ));

      // 读取文件内容
      const content = await readFileContent(uploadFile.file);
      console.log('File content read, length:', content.length);
      
      // 更新进度
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 60 }
          : f
      ));

      // 提取元数据
      const metadata = extractMetadata(content, uploadFile.name);
      console.log('Metadata extracted:', metadata);
      
      // 更新进度
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 80 }
          : f
      ));

      // 创建新的报告对象
      const newReport = {
        id: generateId(),
        title: metadata.title || uploadFile.name.replace('.html', '') || 'Untitled',
        description: metadata.description || '',
        category: uploadFile.categoryId || 'uncategorized',
        tags: metadata.tags || [],
        content: content || '<p>Empty content</p>',
        filePath: `data:text/html;charset=utf-8,${encodeURIComponent(content)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: false,
        readStatus: 'unread' as const,
        fileSize: uploadFile.size,
        wordCount: metadata.wordCount || 0
      };

      console.log('Creating new report:', {
        id: newReport.id,
        title: newReport.title,
        category: newReport.category,
        fileSize: newReport.fileSize
      });

      // 异步添加到报告列表
      const addedReport = await addReport(newReport);
      console.log('Report added to store:', addedReport);

      // 更新状态为成功
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));

      console.log('Upload completed successfully for:', uploadFile.name);

    } catch (error) {
      console.error('Upload file error:', error);
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
            <File style={{ width: '16px', height: '16px' }} />
            选择文件
          </button>
        </div>
        <p style={{ 
          fontSize: '14px',
          color: '#6b7280',
          margin: '0'
        }}>
          支持 .html 文件，最大 10MB
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
            <div style={{ display: 'flex', gap: '8px' }}>
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
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload style={{ width: '14px', height: '14px' }} />
                    上传全部
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
                        file.status === 'uploading' ? '#f0f9ff' : '#f9fafb',
                      color:
                        file.status === 'success' ? '#166534' :
                        file.status === 'error' ? '#dc2626' :
                        file.status === 'uploading' ? '#1d4ed8' : '#374151'
                    }}>
                      {file.status === 'pending' && '待上传'}
                      {file.status === 'uploading' && '上传中'}
                      {file.status === 'success' && '已完成'}
                      {file.status === 'error' && '失败'}
                    </span>
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
                  
                  {file.status === 'uploading' && (
                    <div style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      marginTop: '4px'
                    }}>
                      <div style={{
                        width: `${file.progress}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  )}
                  {file.error && (
                    <p style={{ 
                      fontSize: '12px',
                      color: '#dc2626',
                      margin: '4px 0 0 0'
                    }}>
                      {file.error}
                    </p>
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