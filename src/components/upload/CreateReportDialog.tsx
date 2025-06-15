'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SimpleCategorySelector } from './SimpleCategorySelector';
import { X, FileText, Save, Loader2 } from 'lucide-react';

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReportDialog({ open, onOpenChange }: CreateReportDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    category: 'uncategorized',
    tags: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { addReport } = useAppStore();

  // 从HTML内容中提取标题
  const extractTitleFromHTML = (html: string): string => {
    // 尝试提取 <title> 标签
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    
    // 尝试提取第一个 <h1> 标签
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return h1Match[1].replace(/<[^>]*>/g, '').trim();
    }
    
    // 尝试提取第一个 <h2> 标签
    const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i);
    if (h2Match && h2Match[1]) {
      return h2Match[1].replace(/<[^>]*>/g, '').trim();
    }
    
    return '';
  };

  // 从HTML内容中提取描述
  const extractDescriptionFromHTML = (html: string): string => {
    // 移除HTML标签，获取纯文本
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // 取前200个字符作为描述
    return textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent;
  };

  // 处理HTML内容变化
  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    
    // 如果标题为空，尝试自动提取
    if (!formData.title && content) {
      const extractedTitle = extractTitleFromHTML(content);
      if (extractedTitle) {
        setFormData(prev => ({ ...prev, title: extractedTitle }));
      }
    }
    
    // 如果描述为空，尝试自动提取
    if (!formData.description && content) {
      const extractedDescription = extractDescriptionFromHTML(content);
      if (extractedDescription) {
        setFormData(prev => ({ ...prev, description: extractedDescription }));
      }
    }
  };

  // 添加标签
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('请输入报告标题');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('请输入报告内容');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await addReport({
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        filePath: '', // 直接创建的报告没有文件路径
        isFavorite: false,
        readStatus: 'unread',
        fileSize: new Blob([formData.content]).size,
        wordCount: formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length
      });
      
      // 重置表单
      setFormData({
        title: '',
        content: '',
        description: '',
        category: 'uncategorized',
        tags: [],
        priority: 'medium'
      });
      setTagInput('');
      
      // 关闭对话框
      onOpenChange(false);
      
    } catch (error) {
      console.error('创建报告失败:', error);
      setError(error instanceof Error ? error.message : '创建报告失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.querySelector('input[placeholder="输入标签后按回车添加"]')) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px'
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
          maxWidth: '900px',
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
              <FileText style={{ width: '24px', height: '24px' }} />
              新增报告
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isSubmitting ? 0.5 : 1
              }}
              onMouseOver={(e) => !isSubmitting && ((e.target as HTMLElement).style.backgroundColor = '#f3f4f6')}
              onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '14px',
            margin: '0',
            lineHeight: '1.5'
          }}>
            直接粘贴HTML代码来创建新的研究报告。系统会自动提取标题和描述信息。
          </p>
        </div>

        {/* 内容区域 */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 错误提示 */}
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* 标题 */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '6px'
              }}>
                报告标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入报告标题"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                  color: '#111827'
                }}
              />
            </div>

            {/* HTML内容 */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '6px'
              }}>
                HTML内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="粘贴HTML代码..."
                disabled={isSubmitting}
                rows={12}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                  color: '#111827',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* 描述 */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '6px'
              }}>
                报告描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入报告描述（可选，系统会自动提取）"
                disabled={isSubmitting}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                  color: '#111827',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* 分类选择 */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '6px'
              }}>
                分类
              </label>
              <SimpleCategorySelector
                value={formData.category}
                onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={isSubmitting}
              />
            </div>

            {/* 优先级 */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '6px'
              }}>
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                  color: '#111827'
                }}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>

            {/* 标签 */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '6px'
              }}>
                标签
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入标签后按回车添加"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                    color: '#111827'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isSubmitting || !tagInput.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: isSubmitting || !tagInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || !tagInput.trim() ? 0.5 : 1
                  }}
                >
                  添加
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#374151'
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isSubmitting}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          padding: '0',
                          color: '#6b7280',
                          fontSize: '14px',
                          opacity: isSubmitting ? 0.5 : 1
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: isSubmitting || !formData.title.trim() || !formData.content.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !formData.title.trim() || !formData.content.trim() ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    创建中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    创建报告
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}