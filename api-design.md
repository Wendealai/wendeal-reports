# Wendeal Reports API 接口设计

## 基础信息

- **Base URL**: `/api/v1`
- **认证方式**: JWT Token
- **数据格式**: JSON
- **HTTP状态码**: 标准RESTful状态码

## 认证接口

### 用户注册
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "displayName": "string"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "displayName": "string"
    },
    "token": "jwt_token"
  }
}
```

### 用户登录
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "displayName": "string"
    },
    "token": "jwt_token"
  }
}
```

## 报告管理接口

### 获取报告列表
```
GET /api/v1/reports?page=1&limit=20&category=uuid&search=keyword&status=unread&favorite=true
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "categoryId": "uuid",
        "category": {
          "id": "uuid",
          "name": "string"
        },
        "tags": [
          {
            "id": "uuid",
            "name": "string",
            "color": "#hex"
          }
        ],
        "readStatus": "unread|reading|completed",
        "isFavorite": boolean,
        "fileSize": number,
        "wordCount": number,
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 获取单个报告
```
GET /api/v1/reports/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "content": "html_string",
    "categoryId": "uuid",
    "category": {
      "id": "uuid",
      "name": "string"
    },
    "tags": [...],
    "filePath": "string",
    "fileName": "string",
    "fileSize": number,
    "wordCount": number,
    "readStatus": "string",
    "isFavorite": boolean,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

### 创建报告
```
POST /api/v1/reports
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "title": "string",
  "description": "string",
  "categoryId": "uuid",
  "tags": ["tag1", "tag2"],
  "file": File
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "filePath": "string",
    "createdAt": "ISO8601"
  }
}
```

### 更新报告
```
PUT /api/v1/reports/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "categoryId": "uuid",
  "tags": ["tag1", "tag2"],
  "readStatus": "unread|reading|completed",
  "isFavorite": boolean
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "updatedAt": "ISO8601"
  }
}
```

### 删除报告
```
DELETE /api/v1/reports/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Report deleted successfully"
}
```

### 批量操作报告
```
POST /api/v1/reports/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "delete|update_status|update_category|toggle_favorite",
  "reportIds": ["uuid1", "uuid2"],
  "data": {
    "status": "completed",
    "categoryId": "uuid",
    "isFavorite": true
  }
}

Response:
{
  "success": true,
  "data": {
    "affected": 2,
    "message": "Batch operation completed"
  }
}
```

## 分类管理接口

### 获取分类树
```
GET /api/v1/categories
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "color": "#hex",
      "icon": "string",
      "reportCount": number,
      "children": [
        {
          "id": "uuid",
          "name": "string",
          "reportCount": number,
          "children": []
        }
      ]
    }
  ]
}
```

### 创建分类
```
POST /api/v1/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "parentId": "uuid",
  "color": "#hex",
  "icon": "string"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "createdAt": "ISO8601"
  }
}
```

### 更新分类
```
PUT /api/v1/categories/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "color": "#hex",
  "icon": "string"
}
```

### 删除分类
```
DELETE /api/v1/categories/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Category deleted successfully"
}
```

## 标签管理接口

### 获取标签列表
```
GET /api/v1/tags
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "color": "#hex",
      "usageCount": number
    }
  ]
}
```

### 创建标签
```
POST /api/v1/tags
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "color": "#hex"
}
```

## 文件管理接口

### 上传文件
```
POST /api/v1/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": File,
  "type": "report|avatar"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileName": "string",
    "filePath": "string",
    "fileSize": number,
    "mimeType": "string"
  }
}
```

### 下载文件
```
GET /api/v1/files/{id}/download
Authorization: Bearer {token}

Response: File Stream
```

## 搜索接口

### 全文搜索
```
GET /api/v1/search?q=keyword&category=uuid&tags=tag1,tag2&status=unread&page=1&limit=20
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "results": [...],
    "pagination": {...},
    "facets": {
      "categories": [
        {
          "id": "uuid",
          "name": "string",
          "count": number
        }
      ],
      "tags": [...],
      "statuses": [...]
    }
  }
}
```

### 保存搜索
```
POST /api/v1/search/save
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "query": "string",
  "filters": {
    "category": "uuid",
    "tags": ["tag1"],
    "status": "unread"
  }
}
```

### 获取保存的搜索
```
GET /api/v1/search/saved
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "query": "string",
      "filters": {...},
      "createdAt": "ISO8601"
    }
  ]
}
```

## 统计接口

### 获取仪表板统计
```
GET /api/v1/stats/dashboard
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "totalReports": number,
    "unreadReports": number,
    "favoriteReports": number,
    "totalCategories": number,
    "recentActivity": [
      {
        "type": "upload|read|favorite",
        "reportId": "uuid",
        "reportTitle": "string",
        "timestamp": "ISO8601"
      }
    ],
    "readingProgress": {
      "thisWeek": number,
      "thisMonth": number
    }
  }
}
```

## 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "validation error details"
    }
  }
}
```

## 常见错误码

- `AUTH_REQUIRED`: 需要认证
- `AUTH_INVALID`: 认证无效
- `FORBIDDEN`: 权限不足
- `NOT_FOUND`: 资源不存在
- `VALIDATION_ERROR`: 数据验证失败
- `FILE_TOO_LARGE`: 文件过大
- `UNSUPPORTED_FILE_TYPE`: 不支持的文件类型
- `RATE_LIMIT_EXCEEDED`: 请求频率超限 