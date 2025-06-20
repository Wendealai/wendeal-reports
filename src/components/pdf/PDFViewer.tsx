/**
 * PDF 预览组件
 * 基于 react-pdf 实现
 */

import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  file: string | File;
  className?: string;
  style?: React.CSSProperties;
}

export function PDFViewer({ file, className, style }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | undefined>(undefined);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🚀 基于React最佳实践：添加文件验证
  const isValidFile = file && (typeof file === 'string' || file instanceof File);

  // 🚀 早期返回：如果文件无效，显示错误信息
  if (!isValidFile) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#dc2626'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
            无效的PDF文件
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            请提供有效的PDF文件路径或文件对象
          </p>
        </div>
      </div>
    );
  }

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('✅ PDF文档加载成功，总页数:', numPages);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ PDF加载失败:', error);
    setError(`PDF文件加载失败: ${error.message}`);
    setLoading(false);
    setNumPages(undefined);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const downloadPDF = useCallback(() => {
    if (typeof file === 'string' && file.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = file;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [file]);

  if (error) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#dc2626'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
            PDF 加载失败
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

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
        overflow: 'hidden'
      }}
    >
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {/* 页面导航 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            style={{
              padding: '6px',
              backgroundColor: pageNumber <= 1 ? '#f3f4f6' : '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: pageNumber <= 1 ? '#9ca3af' : '#374151'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <span style={{ 
            fontSize: '14px', 
            color: '#374151',
            minWidth: '80px',
            textAlign: 'center'
          }}>
            {loading ? '加载中...' : `${pageNumber} / ${numPages || 0}`}
          </span>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
            style={{
              padding: '6px',
              backgroundColor: pageNumber >= (numPages || 1) ? '#f3f4f6' : '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: pageNumber >= (numPages || 1) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: pageNumber >= (numPages || 1) ? '#9ca3af' : '#374151'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 缩放和下载控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            style={{
              padding: '6px',
              backgroundColor: scale <= 0.5 ? '#f3f4f6' : '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: scale <= 0.5 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: scale <= 0.5 ? '#9ca3af' : '#374151'
            }}
          >
            <ZoomOut size={16} />
          </button>

          <span style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            minWidth: '40px',
            textAlign: 'center'
          }}>
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            style={{
              padding: '6px',
              backgroundColor: scale >= 3.0 ? '#f3f4f6' : '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: scale >= 3.0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: scale >= 3.0 ? '#9ca3af' : '#374151'
            }}
          >
            <ZoomIn size={16} />
          </button>

          {typeof file === 'string' && file.startsWith('blob:') && (
            <button
              onClick={downloadPDF}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'white',
                fontSize: '12px'
              }}
            >
              <Download size={14} />
              下载
            </button>
          )}
        </div>
      </div>

      {/* PDF内容区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: '#6b7280'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px'
                }} />
                <p>正在加载PDF...</p>
              </div>
            </div>
          )}

          {!loading || numPages ? (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              error={null}
            >
              {numPages && pageNumber <= numPages && (
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadError={(error) => {
                    console.error('❌ PDF页面渲染失败:', error);
                    setError(`页面 ${pageNumber} 渲染失败`);
                  }}
                />
              )}
            </Document>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 