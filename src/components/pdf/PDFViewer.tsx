/**
 * PDF 预览组件 - 简化版本
 * 不依赖任何PDF库，使用浏览器原生支持
 */

import React from 'react';

interface PDFViewerProps {
  file: string | File;
  className?: string;
  style?: React.CSSProperties;
}

export function PDFViewer({ file, className, style }: PDFViewerProps) {
  // 获取文件URL
  const fileUrl = React.useMemo(() => {
    if (typeof file === 'string') {
      return file;
    }
    return URL.createObjectURL(file);
  }, [file]);

  // 清理URL对象
  React.useEffect(() => {
    return () => {
      if (typeof file !== 'string' && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file, fileUrl]);
  
  return (
    <div 
      className={className}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        minHeight: '600px'
      }}
    >
      <div style={{
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#374151' }}>
          PDF 文档预览
        </h3>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe
          src={fileUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            minHeight: '500px'
          }}
          title="PDF预览"
        />
      </div>
      
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          在新窗口中打开PDF
        </a>
      </div>
    </div>
  );
} 