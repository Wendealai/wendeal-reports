'use client';

import { Report } from '@/types';
import { Button } from '@/components/ui/button';
import { Star, Clock, FileText, ExternalLink, ArrowLeft, Edit, StarOff, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ReportEditDialog } from './ReportEditDialog';
import { safeTextContent } from '@/lib/htmlUtils';


interface ReportViewerProps {
  report: Report;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contentBlobUrl, setContentBlobUrl] = useState<string>('');
  const { setSelectedReport, theme, toggleFavorite, deleteReport } = useAppStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 创建内容的Blob URL
  useEffect(() => {
    console.log('📄 处理报告内容:', {
      hasContent: !!report.content,
      hasFilePath: !!report.filePath,
      contentLength: report.content?.length || 0,
      filePath: report.filePath
    });

    if (report.content && report.content.trim()) {
      // 如果有content字段，创建HTML内容
      const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: ${theme === 'dark' ? '#e2e8f0' : '#333'};
            background-color: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
            min-height: 100vh;
            box-sizing: border-box;
        }
        h1, h2, h3 { color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'}; }
        h1 { border-bottom: 2px solid ${theme === 'dark' ? '#60a5fa' : '#2563eb'}; padding-bottom: 10px; }
        h2 { margin-top: 30px; }
        .highlight { background-color: ${theme === 'dark' ? '#374151' : '#fef3c7'}; padding: 2px 4px; border-radius: 3px; }
        .code-block {
            background-color: ${theme === 'dark' ? '#374151' : '#f8fafc'};
            border: 1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'};
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        th, td {
            border: 1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'};
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: ${theme === 'dark' ? '#374151' : '#f8fafc'};
            font-weight: 600;
        }
        a {
            color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
        }
        blockquote {
            border-left: 4px solid ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
            background-color: ${theme === 'dark' ? '#374151' : '#f8fafc'};
            padding: 16px;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    ${report.content}
</body>
</html>`;
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setContentBlobUrl(url);
      console.log('✅ 内容Blob URL创建成功');
      
      // 清理函数
      return () => {
        URL.revokeObjectURL(url);
        console.log('🗑️ Blob URL已清理');
      };
    } else if (report.filePath && report.filePath.trim()) {
      // 如果有文件路径，使用文件路径
      setContentBlobUrl(report.filePath);
      console.log('📁 使用文件路径:', report.filePath);
    } else {
      // 如果既没有content也没有filePath，创建一个占位符HTML
      const simpleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            color: ${theme === 'dark' ? '#e2e8f0' : '#333'};
            background-color: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
            text-align: center;
            min-height: 100vh;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .placeholder {
            padding: 40px;
            background-color: ${theme === 'dark' ? '#374151' : '#f8fafc'};
            border-radius: 8px;
            border: 2px dashed ${theme === 'dark' ? '#475569' : '#e2e8f0'};
            max-width: 500px;
            width: 100%;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        h2 {
            color: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
            margin-bottom: 16px;
        }
        p {
            color: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="placeholder">
        <div class="icon">📄</div>
        <h2>暂无内容</h2>
        <p>${report.description || '该报告暂时没有可显示的内容。您可以点击编辑按钮来添加内容。'}</p>
    </div>
</body>
</html>`;
      
      const blob = new Blob([simpleHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setContentBlobUrl(url);
      console.log('📝 创建占位符内容');
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [report.content, report.filePath, report.title, report.description, theme]);

  const getStatusIcon = (status: Report['readStatus']) => {
    switch (status) {
      case 'completed':
        return <Star style={{ width: '1rem', height: '1rem', color: '#10b981' }} />;
      case 'reading':
        return <Clock style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />;
      default:
        return <FileText style={{ width: '1rem', height: '1rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }} />;
    }
  };

  const getStatusText = (status: Report['readStatus']) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'reading':
        return '阅读中';
      default:
        return '未读';
    }
  };

  const formatDate = (date: Date | string | number) => {
    try {
      let validDate: Date;
      
      if (date instanceof Date) {
        validDate = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        validDate = new Date(date);
      } else {
        console.warn('Invalid date input:', date);
        return '日期无效';
      }
      
      if (isNaN(validDate.getTime())) {
        console.warn('Invalid date value:', date);
        return '日期无效';
      }
      
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(validDate);
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', date);
      return '日期格式错误';
    }
  };

  const handleOpenInNewTab = () => {
    if (contentBlobUrl) {
      window.open(contentBlobUrl, '_blank');
    } else if (report.filePath) {
      // 如果没有contentBlobUrl但有filePath，直接打开filePath
      window.open(report.filePath, '_blank');
    } else {
      console.warn('No content URL available');
    }
  };

  const handleBack = () => {
    setSelectedReport(null);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(report.id);
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除报告 "${report.title}" 吗？此操作无法撤销。`)) {
      setSelectedReport(null);
      deleteReport(report.id);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#000000'
    }}>
      {/* 顶部信息卡片 */}
      <div style={{ 
        margin: '1.5rem', 
        marginBottom: '1rem',
        border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        borderRadius: '0.5rem',
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  margin: 0,
                  color: theme === 'dark' ? '#ffffff' : '#000000'
                }}>
                  {report.title}
                </h1>
                {report.isFavorite && (
                  <Star style={{ width: '1.25rem', height: '1.25rem', color: '#fbbf24', fill: '#fbbf24' }} />
                )}
              </div>
              
              {/* 描述 */}
              {report.description && (
                <div style={{ 
                  marginBottom: '1rem', 
                  fontSize: '0.95rem', 
                  lineHeight: '1.6', 
                  color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                  fontStyle: 'italic' 
                }}>
                  {safeTextContent(report.description)}
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center', 
                gap: '1rem', 
                fontSize: '0.875rem', 
                color: theme === 'dark' ? '#94a3b8' : '#64748b' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {getStatusIcon(report.readStatus)}
                  <span>{getStatusText(report.readStatus)}</span>
                </div>
                <span>创建于 {formatDate(report.createdAt)}</span>
                <span>更新于 {formatDate(report.updatedAt)}</span>
                {report.wordCount && (
                  <span>{report.wordCount.toLocaleString()} 字</span>
                )}
                {report.fileSize && (
                  <span>{(report.fileSize / 1024).toFixed(1)} KB</span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                返回
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                编辑
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToggleFavorite}
                style={{ color: report.isFavorite ? '#ca8a04' : undefined }}
              >
                {report.isFavorite ? (
                  <>
                    <StarOff style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    取消收藏
                  </>
                ) : (
                  <>
                    <Star style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    收藏
                  </>
                )}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                新标签页打开
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete}
                style={{ color: '#ef4444' }}
              >
                <Trash2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                删除
              </Button>
            </div>
          </div>
          
          {report.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem' }}>
              {report.tags.map((tag) => (
                <span 
                  key={tag} 
                  style={{
                    backgroundColor: theme === 'dark' ? '#374151' : '#f1f5f9',
                    color: theme === 'dark' ? '#e5e7eb' : '#374151',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ 
        flex: 1, 
        margin: '0 1.5rem 1.5rem 1.5rem', 
        overflow: 'hidden',
        border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        borderRadius: '0.5rem',
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        <div style={{ padding: 0, height: '100%' }}>
          {(() => {
            // 加载状态显示
            if (isLoading) {
              return (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      border: `2px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                      borderTop: `2px solid ${theme === 'dark' ? '#60a5fa' : '#2563eb'}`,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem auto'
                    }} />
                    <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>加载报告中...</p>
                  </div>
                </div>
              );
            }
            
            // 所有文件都使用iframe显示
            return (
              <iframe
                ref={iframeRef}
                src={contentBlobUrl}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 0, 
                  borderRadius: '0.5rem' 
                }}
                title={report.title}
                onLoad={handleIframeLoad}
                onLoadStart={() => setIsLoading(true)}
              />
            );
          })()}
        </div>
      </div>

      {/* 编辑对话框 */}
      <ReportEditDialog
        report={report}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* 添加旋转动画的CSS */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 