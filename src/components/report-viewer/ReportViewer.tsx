'use client';

import { Report } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, FileText, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface ReportViewerProps {
  report: Report;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

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
    window.open(report.filePath, '_blank');
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
                src={report.filePath}
                className="w-full h-full border-0 rounded-lg"
                title={report.title}
                onLoad={() => setIsLoading(false)}
                onLoadStart={() => setIsLoading(true)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 