'use client';

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [initStatus, setInitStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkHealth = async () => {
    try {
      addLog('检查系统健康状态...')
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthStatus(data)
      addLog(`健康检查完成: ${data.status}`)
    } catch (error) {
      addLog(`健康检查失败: ${error}`)
    }
  }

  const checkInitStatus = async () => {
    try {
      addLog('检查数据库初始化状态...')
      const response = await fetch('/api/init')
      const data = await response.json()
      setInitStatus(data)
      addLog(`初始化状态: ${data.initialized ? '已初始化' : '未初始化'}`)
    } catch (error) {
      addLog(`初始化状态检查失败: ${error}`)
    }
  }

  const initializeDatabase = async () => {
    try {
      setLoading(true)
      addLog('开始初始化数据库...')
      const response = await fetch('/api/init', { method: 'POST' })
      const data = await response.json()
      setInitStatus(data)
      addLog(`数据库初始化完成: 创建了 ${data.categoriesCreated} 个分类`)
      
      // 重新检查状态
      await checkInitStatus()
    } catch (error) {
      addLog(`数据库初始化失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testReportUpload = async () => {
    try {
      setLoading(true)
      addLog('测试报告创建...')
      
      const testReport = {
        title: '测试报告 - ' + new Date().toLocaleString(),
        content: '<h1>这是一个测试报告</h1><p>用于验证数据库上传功能是否正常工作。</p>',
        description: '这是一个测试报告用于验证功能',
        status: 'published',
        categoryId: 'predefined-uncategorized',
        tags: ['测试', '调试']
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testReport)
      })

      const data = await response.json()
      
      if (response.ok) {
        addLog(`✅ 报告创建成功: ${data.report.title}`)
        addLog(`报告ID: ${data.report.id}`)
      } else {
        addLog(`❌ 报告创建失败: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ 报告创建异常: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testCategoriesAPI = async () => {
    try {
      addLog('测试分类API...')
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (response.ok) {
        addLog(`✅ 分类API正常，共 ${data.categories.length} 个分类`)
        data.categories.forEach((cat: any, index: number) => {
          addLog(`  ${index + 1}. ${cat.name} (${cat.id})`)
        })
      } else {
        addLog(`❌ 分类API失败: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ 分类API异常: ${error}`)
    }
  }

  const testReportsAPI = async () => {
    try {
      addLog('测试报告API...')
      const response = await fetch('/api/reports')
      const data = await response.json()
      
      if (response.ok) {
        addLog(`✅ 报告API正常，共 ${data.reports.length} 个报告`)
        if (data.reports.length > 0) {
          addLog(`最新报告: ${data.reports[0].title}`)
        }
      } else {
        addLog(`❌ 报告API失败: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ 报告API异常: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    checkHealth()
    checkInitStatus()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔧 Wendeal Reports 调试工具</h1>
      
      {/* 系统状态 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>系统状态</h2>
        {healthStatus && (
          <div>
            <p><strong>健康状态:</strong> <span style={{ color: healthStatus.status === 'healthy' ? 'green' : 'red' }}>{healthStatus.status}</span></p>
            <p><strong>数据库:</strong> {healthStatus.database}</p>
            <p><strong>环境:</strong> {healthStatus.environment}</p>
          </div>
        )}
        
        {initStatus && (
          <div>
            <p><strong>数据库初始化:</strong> <span style={{ color: initStatus.initialized ? 'green' : 'orange' }}>{initStatus.initialized ? '已初始化' : '未初始化'}</span></p>
            <p><strong>报告数量:</strong> {initStatus.reportCount}</p>
            <p><strong>分类数量:</strong> {initStatus.categoryCount}</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={checkHealth}
          style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🔍 检查健康状态
        </button>
        
        <button 
          onClick={checkInitStatus}
          style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          📋 检查初始化状态
        </button>
        
        <button 
          onClick={initializeDatabase}
          disabled={loading}
          style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          🚀 初始化数据库
        </button>
        
        <button 
          onClick={testCategoriesAPI}
          style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          📁 测试分类API
        </button>
        
        <button 
          onClick={testReportsAPI}
          style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          📄 测试报告API
        </button>
        
        <button 
          onClick={testReportUpload}
          disabled={loading}
          style={{ padding: '8px 16px', backgroundColor: '#06b6d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          ⬆️ 测试报告上传
        </button>
        
        <button 
          onClick={clearLogs}
          style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🗑️ 清空日志
        </button>
      </div>

      {/* 日志输出 */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9' }}>
        <h3>🚦 操作日志</h3>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          fontFamily: 'monospace', 
          fontSize: '12px',
          backgroundColor: '#000',
          color: '#00ff00',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#888' }}>等待操作...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f0f9ff' }}>
        <h3>📖 使用说明</h3>
        <ol>
          <li><strong>首次使用:</strong> 点击"初始化数据库"创建默认用户和分类</li>
          <li><strong>测试上传:</strong> 点击"测试报告上传"验证文档创建功能</li>
          <li><strong>检查API:</strong> 使用"测试分类API"和"测试报告API"验证后端连接</li>
          <li><strong>问题排查:</strong> 观察日志输出了解具体错误信息</li>
        </ol>
      </div>
    </div>
  )
} 