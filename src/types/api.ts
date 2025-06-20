// API 相关的类型定义

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  token: string;
}

export interface ReportResponse {
  id: string;
  title: string;
  content: string;
  description?: string;
  summary?: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  categoryId?: string;
  userId: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: CategoryResponse;
  tags?: TagResponse[];
  fileCount?: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  children?: CategoryResponse[];
  reportCount?: number;
}

export interface TagResponse {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReportsListResponse {
  reports: ReportResponse[];
  pagination: PaginationResponse;
}

export interface CategoriesListResponse {
  categories: CategoryResponse[];
}

export interface TagsListResponse {
  tags: TagResponse[];
}

// 请求参数类型
export interface CreateReportRequest {
  title: string;
  content: string;
  summary?: string;
  status?: 'draft' | 'published' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  categoryId?: string;
  tags?: string[];
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

// 查询参数类型
export interface ReportsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  search?: string;
} 