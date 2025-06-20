'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export function CategoryDebugger() {
  const { categories, predefinedCategoryNames } = useAppStore();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4>分类调试信息</h4>
      
      <div>
        <strong>预定义分类 ({Object.keys(predefinedCategoryNames).length}):</strong>
        <pre>{JSON.stringify(predefinedCategoryNames, null, 2)}</pre>
      </div>
      
      <div>
        <strong>Store中的分类 ({categories.length}):</strong>
        <pre>{JSON.stringify(categories, null, 2)}</pre>
      </div>
    </div>
  );
} 