import { createLogger, performanceLogger } from "./logger";
import { AppError, createError, handleApiError } from "./error-handler";

const logger = createLogger("ApiClient");

// API响应类型定义
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReportData {
  id: string;
  title: string;
  content?: string;
  description?: string;
  categoryId?: string;
  status: string;
  priority?: string;
  tags: string[] | TagData[];
  createdAt: string;
  updatedAt: string;
  fileSize?: number;
  wordCount?: number;
  isFavorite?: boolean;
  category?: CategoryData;
}

interface CategoryData {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  parentId?: string;
  reportCount?: number;
}

interface TagData {
  id: string;
  name: string;
  color?: string;
}

interface CreateReportRequest {
  title: string;
  content?: string;
  description?: string;
  categoryId?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  status?: string;
}

interface UpdateReportRequest {
  title?: string;
  content?: string;
  description?: string;
  categoryId?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  status?: string;
}

interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  parentId?: string;
}

interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
  description?: string;
  parentId?: string;
}

interface ReportsListResponse {
  reports: ReportData[];
  pagination: PaginationInfo;
}

interface CategoriesListResponse {
  categories: CategoryData[];
}

interface ReportResponse {
  report: ReportData;
  message?: string;
}

interface CategoryResponse {
  category: CategoryData;
  message?: string;
}

// API错误类
export class ApiError extends AppError {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message, status);
    this.name = "ApiError";
  }
}

// API配置
const API_BASE_URL = "/api";
const DEFAULT_TIMEOUT = 10000; // 10秒

// 请求配置接口
interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

// 创建具有超时的fetch函数
const fetchWithTimeout = async (
  url: string,
  config: RequestConfig = {},
): Promise<Response> => {
  const { timeout = DEFAULT_TIMEOUT, ...fetchConfig } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw createError.general(`Request timeout after ${timeout}ms`, 408);
    }
    throw error;
  }
};

// 带重试机制的请求函数
const requestWithRetry = async <T>(
  endpoint: string,
  config: RequestConfig = {},
  retries: number = 2,
): Promise<T> => {
  const { retries: configRetries, ...requestConfig } = config;
  const maxRetries = configRetries ?? retries;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await performanceLogger.measure(
        `API Request: ${endpoint}`,
        async () => {
          return await request<T>(endpoint, requestConfig);
        },
      );
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt || error instanceof ApiError) {
        throw error;
      }

      // 指数退避重试
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      logger.warn(`Request failed, retrying in ${delay}ms`, {
        endpoint,
        attempt: attempt + 1,
        maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw createError.general("Max retries exceeded");
};

// 基础请求函数
async function request<T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const requestConfig: RequestConfig = {
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
    ...config,
  };

  logger.debug("API Request", {
    url,
    method: requestConfig.method || "GET",
    hasBody: !!requestConfig.body,
  });

  try {
    const response = await fetchWithTimeout(url, requestConfig);

    logger.debug("API Response", {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    let data: unknown;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text;
    }

    if (!response.ok) {
      const errorMessage =
        (data as { error?: string })?.error || response.statusText;
      logger.error("API Error Response", {
        status: response.status,
        error: errorMessage,
        data,
      });

      throw new ApiError(errorMessage, response.status, data);
    }

    logger.debug("API Response Data", { dataType: typeof data });
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error("Network Error", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });

    throw createError.general(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      0,
    );
  }
}

// 报告API
export const reportsApi = {
  async getAll(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      categoryId?: string;
      search?: string;
    } = {},
  ): Promise<ReportsListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const query = searchParams.toString();
    const endpoint = `/reports${query ? `?${query}` : ""}`;

    return requestWithRetry<ReportsListResponse>(endpoint);
  },

  async getById(id: string): Promise<ReportResponse> {
    if (!id) {
      throw createError.validation("Report ID is required");
    }

    return requestWithRetry<ReportResponse>(
      `/reports/${encodeURIComponent(id)}`,
    );
  },

  async create(data: CreateReportRequest): Promise<ReportResponse> {
    // 输入验证
    if (!data.title || data.title.trim().length === 0) {
      throw createError.validation("Title is required", "title");
    }

    if (data.title.length > 200) {
      throw createError.validation(
        "Title must be less than 200 characters",
        "title",
      );
    }

    return requestWithRetry<ReportResponse>("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateReportRequest): Promise<ReportResponse> {
    if (!id) {
      throw createError.validation("Report ID is required");
    }

    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        throw createError.validation("Title cannot be empty", "title");
      }

      if (data.title.length > 200) {
        throw createError.validation(
          "Title must be less than 200 characters",
          "title",
        );
      }
    }

    return requestWithRetry<ReportResponse>(
      `/reports/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  async delete(id: string): Promise<{ message: string }> {
    if (!id) {
      throw createError.validation("Report ID is required");
    }

    return requestWithRetry<{ message: string }>(
      `/reports/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },
};

// 分类API
export const categoriesApi = {
  async getAll(): Promise<CategoriesListResponse> {
    return requestWithRetry<CategoriesListResponse>("/categories");
  },

  async getById(id: string): Promise<CategoryResponse> {
    if (!id) {
      throw createError.validation("Category ID is required");
    }

    return requestWithRetry<CategoryResponse>(
      `/categories/${encodeURIComponent(id)}`,
    );
  },

  async create(data: CreateCategoryRequest): Promise<CategoryResponse> {
    if (!data.name || data.name.trim().length === 0) {
      throw createError.validation("Category name is required", "name");
    }

    if (data.name.length > 100) {
      throw createError.validation(
        "Category name must be less than 100 characters",
        "name",
      );
    }

    return requestWithRetry<CategoryResponse>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: string,
    data: UpdateCategoryRequest,
  ): Promise<CategoryResponse> {
    if (!id) {
      throw createError.validation("Category ID is required");
    }

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw createError.validation("Category name cannot be empty", "name");
      }

      if (data.name.length > 100) {
        throw createError.validation(
          "Category name must be less than 100 characters",
          "name",
        );
      }
    }

    return requestWithRetry<CategoryResponse>(
      `/categories/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  async delete(id: string): Promise<{ message: string }> {
    if (!id) {
      throw createError.validation("Category ID is required");
    }

    return requestWithRetry<{ message: string }>(
      `/categories/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },
};

// 标签API
export const tagsApi = {
  async getAll(): Promise<{ tags: TagData[] }> {
    return requestWithRetry<{ tags: TagData[] }>("/tags");
  },

  async create(data: {
    name: string;
    color?: string;
  }): Promise<{ tag: TagData; message: string }> {
    if (!data.name || data.name.trim().length === 0) {
      throw createError.validation("Tag name is required", "name");
    }

    if (data.name.length > 50) {
      throw createError.validation(
        "Tag name must be less than 50 characters",
        "name",
      );
    }

    return requestWithRetry<{ tag: TagData; message: string }>("/tags", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// 健康检查API
export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return request<{ status: string; timestamp: string }>("/health");
  },
};

// 导出类型
export type {
  ReportData,
  CategoryData,
  TagData,
  CreateReportRequest,
  UpdateReportRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ReportsListResponse,
  CategoriesListResponse,
  ReportResponse,
  CategoryResponse,
  ApiResponse,
  PaginationInfo,
};
