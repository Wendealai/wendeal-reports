'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Report, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface ReportEditDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportEditDialog({ report, open, onOpenChange }: ReportEditDialogProps) {
  const { updateReport, categories, theme } = useAppStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当报告变化时更新表单数据
  useEffect(() => {
    if (report) {
      setFormData({
        title: report.title,
        description: report.description || '',
        category: report.category,
        tags: [...report.tags],
      });
    }
  }, [report]);

  // 获取扁平化的分类列表
  const getFlatCategories = (categories: Category[]): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];
    
    const traverse = (cats: Category[], level = 0) => {
      for (const cat of cats) {
        result.push({
          id: cat.id,
          name: cat.name,
          level,
        });
        if (cat.children) {
          traverse(cat.children, level + 1);
        }
      }
    };
    
    traverse(categories);
    return result;
  };

  const flatCategories = getFlatCategories(categories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || isSubmitting) return;

    setIsSubmitting(true);
    console.log('📝 提交报告编辑:', formData);

    try {
      await updateReport(report.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        tags: formData.tags,
      });

      console.log('✅ 报告更新成功');
      onOpenChange(false);
    } catch (error) {
      console.error('❌ 报告更新失败 - 完整错误信息:', error);
      console.error('❌ 错误类型:', typeof error);
      console.error('❌ 错误构造函数:', error?.constructor?.name);
      
      if (error && typeof error === 'object') {
        console.error('❌ 错误属性:', Object.keys(error));
        console.error('❌ 错误详情:', JSON.stringify(error, null, 2));
      }
      
      let errorMessage = '未知错误';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ Error.message:', error.message);
        console.error('❌ Error.stack:', error.stack);
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      } else {
        errorMessage = String(error);
      }
      
      alert('更新失败: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!report || !open) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        maxWidth: '42rem',
        width: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`
      }}>
        {/* 头部 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: 0,
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }}>
            编辑报告信息
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: theme === 'dark' ? '#94a3b8' : '#64748b',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 标题 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#e2e8f0' : '#374151'
            }}>
              标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="报告标题"
              required
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${theme === 'dark' ? '#475569' : '#d1d5db'}`,
                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* 描述 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#e2e8f0' : '#374151'
            }}>
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="报告描述（可选）"
              rows={3}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${theme === 'dark' ? '#475569' : '#d1d5db'}`,
                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '0.875rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* 分类 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#e2e8f0' : '#374151'
            }}>
              分类
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${theme === 'dark' ? '#475569' : '#d1d5db'}`,
                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '0.875rem'
              }}
            >
              <option value="uncategorized">未分类</option>
              <option value="tech-research">技术研究</option>
              <option value="market-analysis">市场分析</option>
              <option value="product-review">产品评测</option>
              <option value="industry-insights">行业洞察</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'  '.repeat(cat.level)}{cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 标签 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#e2e8f0' : '#374151'
            }}>
              标签
            </label>
            
            {/* 已有标签 */}
            {formData.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {formData.tags.map((tag) => (
                  <span 
                    key={tag} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      backgroundColor: theme === 'dark' ? '#475569' : '#f1f5f9',
                      color: theme === 'dark' ? '#e2e8f0' : '#475569',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        padding: '0.125rem',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      <X style={{ width: '0.75rem', height: '0.75rem' }} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 添加新标签 */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="添加标签"
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${theme === 'dark' ? '#475569' : '#d1d5db'}`,
                  backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  fontSize: '0.875rem'
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
              >
                <Plus style={{ width: '1rem', height: '1rem' }} />
              </Button>
            </div>
          </div>

          {/* 底部按钮 */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? '保存中...' : '保存更改'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 