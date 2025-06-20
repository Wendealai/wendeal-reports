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
import { useAppStore } from '@/store/useAppStore';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [uploadComplete, setUploadComplete] = useState(false);
  const { refreshData } = useAppStore();

  console.log('UploadDialog render:', { open, uploadComplete });

  const handleUploadComplete = async () => {
    console.log('Upload completed!');
    setUploadComplete(true);
    
    // 不要立即刷新数据，避免覆盖刚添加的报告
    // 让Zustand的状态管理自然更新界面
    console.log('Upload completed, letting Zustand handle state updates');
    
    // 延迟关闭对话框，让用户看到成功状态
    setTimeout(() => {
      setUploadComplete(false);
      onOpenChange(false);
      // 强制触发一次界面更新
      window.dispatchEvent(new Event('storage'));
    }, 1500);
  };

  const handleClose = () => {
    console.log('Dialog close requested:', { uploadComplete });
    if (!uploadComplete) {
      onOpenChange(false);
    }
  };

  // 使用内联样式确保对话框正确显示
  if (open) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* 头部 */}
          <div style={{ 
            padding: '24px 24px 16px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#111827'
              }}>
                <Upload style={{ width: '24px', height: '24px' }} />
                上传报告文件
              </h2>
              <button
                onClick={handleClose}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                                 onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#f3f4f6'}
                 onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                ✕
              </button>
            </div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '0',
              lineHeight: '1.5'
            }}>
              选择或拖拽 HTML 文件来添加新的研究报告。系统会自动提取文件的标题、描述和标签信息。
            </p>
          </div>

          {/* 内容区域 */}
          <div style={{ 
            flex: 1,
            overflow: 'auto',
            padding: '24px'
          }}>
            <FileUpload 
              onUploadComplete={handleUploadComplete}
            />

            {uploadComplete && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                marginTop: '16px',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ 
                  color: '#16a34a', 
                  fontWeight: '500',
                  fontSize: '16px'
                }}>
                  ✅ 文件上传成功！正在关闭对话框...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
} 