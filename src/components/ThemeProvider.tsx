'use client';

import { useEffect, ReactNode } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ThemeProvider');

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useAppStore();

  useEffect(() => {
    // 应用主题到DOM
    const root = document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('light', 'dark');
    
    // 添加当前主题类
    root.classList.add(theme);
    
    // 更新meta标签颜色
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#171717' : '#ffffff');
    }
    
    // 调试输出
    logger.debug('Theme applied', { theme, htmlClasses: root.className });
  }, [theme]);

  return <>{children}</>;
} 