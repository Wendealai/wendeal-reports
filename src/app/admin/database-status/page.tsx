"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface DatabaseStatus {
  initialized: boolean;
  message: string;
  error?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  userId: string;
}

interface CategoryResult {
  action: 'created' | 'exists' | 'error';
  category?: Category;
  categoryId?: string;
  error?: string;
}

interface InitResult {
  success: boolean;
  user?: User;
  categories?: Category[];
  categoryResults?: CategoryResult[];
  message?: string;
  error?: string;
}

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [initResult, setInitResult] = useState<InitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/init-database');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check database status:', error);
      setStatus({
        initialized: false,
        message: '无法检查数据库状态',
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDatabase = async () => {
    setInitializing(true);
    try {
      const response = await fetch('/api/admin/init-database', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        setInitResult({
          success: true,
          ...data.result,
          message: data.message
        });
        // Refresh status after successful initialization
        await checkStatus();
      } else {
        setInitResult({
          success: false,
          error: data.error || data.message,
          message: data.message
        });
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setInitResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '数据库初始化失败'
      });
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const StatusIcon = ({ initialized, error }: { initialized: boolean; error?: string }) => {
    if (error) return <XCircle className="h-5 w-5 text-red-500" />;
    if (initialized) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const StatusBadge = ({ initialized, error }: { initialized: boolean; error?: string }) => {
    if (error) return <Badge variant="destructive">错误</Badge>;
    if (initialized) return <Badge variant="default" className="bg-green-500">已初始化</Badge>;
    return <Badge variant="secondary">需要初始化</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">数据库状态管理</h1>
        <p className="text-muted-foreground mt-2">
          检查和管理数据库初始化状态
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              status && <StatusIcon initialized={status.initialized} error={status.error} />
            )}
            数据库状态
          </CardTitle>
          <CardDescription>
            当前数据库初始化状态和用户数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>检查状态中...</span>
            </div>
          ) : status ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">初始化状态:</span>
                <StatusBadge initialized={status.initialized} error={status.error} />
              </div>
              
              <div>
                <span className="font-medium">消息:</span>
                <p className="text-sm text-muted-foreground mt-1">{status.message}</p>
              </div>

              {status.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{status.error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={checkStatus} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新状态
                </Button>
                
                {!status.initialized && !status.error && (
                  <Button 
                    onClick={initializeDatabase} 
                    disabled={initializing}
                    size="sm"
                  >
                    {initializing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        初始化中...
                      </>
                    ) : (
                      '初始化数据库'
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">无法获取状态信息</p>
          )}
        </CardContent>
      </Card>

      {/* Initialization Result */}
      {initResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {initResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              初始化结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-medium">状态:</span>
                <Badge variant={initResult.success ? "default" : "destructive"} className="ml-2">
                  {initResult.success ? '成功' : '失败'}
                </Badge>
              </div>

              <div>
                <span className="font-medium">消息:</span>
                <p className="text-sm text-muted-foreground mt-1">{initResult.message}</p>
              </div>

              {initResult.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{initResult.error}</AlertDescription>
                </Alert>
              )}

              {initResult.success && initResult.user && (
                <div>
                  <span className="font-medium">用户信息:</span>
                  <div className="bg-muted p-3 rounded-md mt-2">
                    <p className="text-sm">ID: {initResult.user.id}</p>
                    <p className="text-sm">用户名: {initResult.user.username}</p>
                    <p className="text-sm">邮箱: {initResult.user.email}</p>
                  </div>
                </div>
              )}

              {initResult.success && initResult.categories && (
                <div>
                  <span className="font-medium">分类信息 ({initResult.categories.length}个):</span>
                  <div className="bg-muted p-3 rounded-md mt-2 max-h-40 overflow-y-auto">
                    {initResult.categories.map((category, index) => (
                      <div key={index} className="text-sm mb-1">
                        {category.icon} {category.name} ({category.id})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {initResult.categoryResults && (
                <div>
                  <span className="font-medium">分类创建详情:</span>
                  <div className="bg-muted p-3 rounded-md mt-2 max-h-40 overflow-y-auto">
                    {initResult.categoryResults.map((result, index) => (
                      <div key={index} className="text-sm mb-1 flex items-center gap-2">
                        {result.action === 'created' && <CheckCircle className="h-3 w-3 text-green-500" />}
                        {result.action === 'exists' && <AlertCircle className="h-3 w-3 text-blue-500" />}
                        {result.action === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
                        <span>
                          {result.category ? `${result.category.name} (${result.action})` : `${result.categoryId} (${result.action})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>检查状态:</strong> 点击"刷新状态"按钮检查当前数据库初始化状态
            </div>
            <div>
              <strong>初始化数据库:</strong> 如果数据库未初始化，点击"初始化数据库"按钮创建默认用户和分类
            </div>
            <div>
              <strong>故障排除:</strong> 如果初始化失败，请检查数据库连接和权限设置
            </div>
            <div className="bg-yellow-50 p-3 rounded-md">
              <strong>注意:</strong> 数据库初始化只需要执行一次。重复执行不会覆盖现有数据。
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
