'use client';

import { useState, useEffect } from 'react';

export default function SimplePage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('auth_token'));
    }
  }, []);

  const handleDemoLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', 'demo_token_123');
      localStorage.setItem('user_info', JSON.stringify({
        id: 'demo',
        username: '演示用户',
        email: 'demo@wendeal.com'
      }));
      alert('✅ 演示登录成功！即将跳转...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      setToken(null);
      alert('✅ 已清除所有数据');
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0'
    }}>
      <h1>🧪 简单测试页面</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>当前Token:</strong> {token || '无'}</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleDemoLogin}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🚀 演示登录
        </button>

        <button 
          onClick={handleClear}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🧹 清除数据
        </button>

        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🏠 返回首页
        </button>

        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          📊 去仪表板
        </button>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3>🎯 测试步骤</h3>
        <ol>
          <li>点击"清除数据"按钮清理环境</li>
          <li>点击"演示登录"设置认证信息</li>
          <li>点击"去仪表板"测试是否能正常跳转</li>
        </ol>
      </div>
    </div>
  );
} 