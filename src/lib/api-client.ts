// API客户端配置
const API_BASE_URL = '/api'

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message)
    this.name = 'ApiError'
  }
}

// 基础请求函数（已移除认证逻辑）
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  console.log('🌐 API请求开始:', {
    url,
    method: config.method || 'GET',
    headers: config.headers,
    body: options.body
  });

  try {
    const response = await fetch(url, config)
    
    console.log('📡 API响应:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    const data = await response.json()

    console.log('📄 响应数据:', data);

    if (!response.ok) {
      console.error('❌ API错误:', { status: response.status, error: data.error, data });
      throw new ApiError(response.status, data.error || '请求失败', data)
    }

    return data
  } catch (error) {
    console.error('🚫 网络错误:', error);
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, '网络错误或服务器无响应')
  }
}

// 认证API
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    request<{ message: string; user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ message: string; user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// 报告API
export const reportsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    status?: string
    categoryId?: string
    search?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return request<{
      reports: any[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/reports${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    request<{ report: any }>(`/reports/${id}`),

  create: (data: any) =>
    request<{ message: string; report: any }>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<{ message: string; report: any }>(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/reports/${id}`, {
      method: 'DELETE',
    }),
}

// 分类API
export const categoriesApi = {
  getAll: () =>
    request<{ categories: any[] }>('/categories'),

  getById: (id: string) =>
    request<{ category: any }>(`/categories/${id}`),

  create: (data: any) =>
    request<{ message: string; category: any }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<{ message: string; category: any }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
}

// 标签API
export const tagsApi = {
  getAll: () =>
    request<{ tags: any[] }>('/tags'),

  create: (data: any) =>
    request<{ message: string; tag: any }>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// 迁移API
export const migrationApi = {
  getStatus: () =>
    request<{
      hasData: boolean
      reportCount: number
      categoryCount: number
    }>('/migrate'),

  migrate: (data: any) =>
    request<{
      message: string
      results: {
        categoriesCreated: number
        reportsCreated: number
        tagsCreated: number
        errors: string[]
      }
    }>('/migrate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export { ApiError }

// 清除认证令牌的工具函数
export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  }
}; 