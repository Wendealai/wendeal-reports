'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    console.log('单用户系统，直接跳转到仪表板');
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