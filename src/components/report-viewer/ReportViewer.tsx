'use client';

import { Report } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, FileText, ExternalLink, ArrowLeft, Edit, StarOff } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ReportEditDialog } from './ReportEditDialog';

interface ReportViewerProps {
  report: Report;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { setSelectedReport, theme, toggleFavorite } = useAppStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getStatusIcon = (status: Report['readStatus']) => {
    switch (status) {
      case 'completed':
        return <Star className="h-4 w-4 text-green-500" />;
      case 'reading':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handleOpenInNewTab = () => {
    // 如果filePath是data URL，直接打开
    if (report.filePath.startsWith('data:')) {
      console.log('Opening data URL in new tab');
      window.open(report.filePath, '_blank');
      return;
    }
    
    // 如果是相对路径，但文件可能不存在，则从iframe获取内容
    const iframe = iframeRef.current;
    console.log('Iframe ref:', iframe);
    console.log('Iframe contentDocument:', iframe?.contentDocument);
    
    if (iframe && iframe.contentDocument) {
      try {
        const htmlContent = iframe.contentDocument.documentElement.outerHTML;
        console.log('Got HTML content, length:', htmlContent.length);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        // 清理URL对象
        if (newWindow) {
          newWindow.addEventListener('beforeunload', () => {
            URL.revokeObjectURL(url);
          });
        } else {
          // 如果无法打开新窗口，清理URL
          URL.revokeObjectURL(url);
          console.warn('无法打开新窗口，可能被弹窗阻止器阻止');
        }
      } catch (error) {
        console.error('获取iframe内容失败:', error);
        // 回退到原始路径
        window.open(report.filePath, '_blank');
      }
    } else {
      console.log('Iframe not available, opening original path');
      // 回退到原始路径
      window.open(report.filePath, '_blank');
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

  // const handleStatusChange = (status: Report['readStatus']) => {
  //   updateReportsStatus([report.id], status);
  // };

  // 注入主题样式到iframe中的HTML内容
  const injectThemeStyles = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeDoc = iframe.contentDocument;
    
    // 移除已有的主题样式
    const existingStyle = iframeDoc.getElementById('theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 创建新的主题样式
    const style = iframeDoc.createElement('style');
    style.id = 'theme-styles';
    style.textContent = `
      :root {
        color-scheme: ${theme};
      }
      
      body {
        background-color: ${theme === 'dark' ? '#0f172a' : '#ffffff'};
        color: ${theme === 'dark' ? '#f1f5f9' : '#0f172a'};
        transition: background-color 0.2s, color 0.2s;
      }
      
      /* 调整链接颜色 */
      a {
        color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
      }
      
      /* 调整代码块样式 */
      pre, code {
        background-color: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
        color: ${theme === 'dark' ? '#e2e8f0' : '#334155'};
        border: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
      }
      
      /* 调整表格样式 */
      table {
        border-color: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
      }
      
      th, td {
        border-color: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
      }
      
      th {
        background-color: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
      }
      
      /* 调整引用块样式 */
      blockquote {
        border-left-color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
        background-color: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
      }
    `;
    
    iframeDoc.head.appendChild(style);
  }, [theme]);

  // 监听主题变化
  useEffect(() => {
    if (iframeRef.current?.contentDocument) {
      injectThemeStyles();
    }
  }, [theme, injectThemeStyles]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    // iframe加载完成后注入主题样式
    setTimeout(() => {
      injectThemeStyles();
    }, 100);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Card className="mx-6 mt-6 mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {report.title}
                </h1>
                {report.isFavorite && (
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                )}
              </div>
              
              {report.description && (
                <p className="text-muted-foreground">
                  {report.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
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
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToggleFavorite}
                className={report.isFavorite ? "text-yellow-600" : ""}
              >
                {report.isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    取消收藏
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    收藏
                  </>
                )}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                新标签页打开
              </Button>
            </div>
          </div>
          
          {report.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {report.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="flex-1 mx-6 mb-6 overflow-hidden">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">加载报告中...</p>
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={report.filePath}
                className="w-full h-full border-0 rounded-lg"
                title={report.title}
                onLoad={handleIframeLoad}
                onLoadStart={() => setIsLoading(true)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 编辑对话框 */}
      <ReportEditDialog
        report={report}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
} 