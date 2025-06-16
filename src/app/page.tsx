'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Page');

export default function Home() {
  useEffect(() => {
    logger.debug('单用户系统，直接跳转到仪表板');
    window.location.href = '/dashboard';
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          正在加载 Wendeal Reports...
        </p>
      </div>
    </div>
  );
}