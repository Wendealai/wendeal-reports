# Wendeal Reports 数据库集成指南

## 🎯 系统架构变化

### 原有架构（localStorage）

- 前端使用 Zustand + localStorage 持久化
- 所有数据存储在浏览器本地
- 刷新页面数据可能丢失

### 新架构（后端数据库）

- 前端 Zustand 状态管理 + 后端 SQLite 数据库
- 完整的 REST API 接口
- 数据持久化到服务器
- 支持多用户和权限管理

## 🔄 数据迁移流程

### 1. 用户注册/登录

```
访问 /login 页面 → 注册账户 → 获取 JWT Token
```

### 2. 数据迁移

```
主页面 → 点击"📤 迁移到数据库"按钮 → 自动迁移所有本地数据
```

### 3. 完全切换到数据库模式

```
迁移完成后 → 系统自动从后端加载数据 → localStorage 作为缓存
```

## 🛠️ 核心功能变化

### 报告管理

- **添加报告**: `addReport()` → 异步调用 `POST /api/reports`
- **更新报告**: `updateReport()` → 异步调用 `PUT /api/reports/:id`
- **删除报告**: `deleteReport()` → 异步调用 `DELETE /api/reports/:id`
- **获取报告**: `loadData()` → 异步调用 `GET /api/reports`

### 分类管理

- **添加分类**: `addCategory()` → 异步调用 `POST /api/categories`
- **更新分类**: `updateCategory()` → 异步调用 `PUT /api/categories/:id`
- **删除分类**: `deleteCategory()` → 异步调用 `DELETE /api/categories/:id`

### 状态同步

- **本地状态**: Zustand store 作为前端缓存
- **服务器状态**: SQLite 数据库作为真实数据源
- **同步机制**: 每次操作都会同步到服务器

## 📊 数据库架构

### 主要表结构

```sql
-- 用户表
users (id, email, username, password_hash, created_at, updated_at)

-- 报告表
reports (id, title, content, summary, status, priority, category_id, user_id, created_at, updated_at)

-- 分类表
categories (id, name, description, color, icon, user_id, created_at, updated_at)

-- 标签表
tags (id, name, color, created_at, updated_at)

-- 报告标签关联表
report_tags (report_id, tag_id)

-- 文件表
files (id, filename, file_path, file_size, mime_type, report_id, created_at)
```

## 🚀 使用指南

### 首次使用

1. **启动服务器**: `npm run dev`
2. **访问登录页**: `http://localhost:3000/login`
3. **注册账户**: 填写邮箱、用户名、密码
4. **登录系统**: 获取访问权限

### 数据迁移

1. **检查本地数据**: 确认有需要迁移的报告
2. **点击迁移按钮**: 绿色"📤 迁移到数据库"按钮
3. **等待完成**: 系统会显示迁移结果
4. **验证数据**: 刷新页面确认数据正确加载

### 日常使用

- **上传报告**: 点击"📤 上传报告"按钮
- **管理分类**: 左侧导航栏管理分类
- **搜索过滤**: 使用顶部搜索栏
- **拖拽操作**: 在三列看板间拖拽报告
- **批量操作**: 选择多个报告进行批量处理

## 🔧 API 接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 报告接口

- `GET /api/reports` - 获取报告列表
- `POST /api/reports` - 创建新报告
- `PUT /api/reports/:id` - 更新报告
- `DELETE /api/reports/:id` - 删除报告

### 分类接口

- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建新分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 迁移接口

- `GET /api/migrate` - 获取迁移状态
- `POST /api/migrate` - 执行数据迁移

## 🛡️ 安全特性

### 身份验证

- JWT Token 认证
- 密码哈希存储
- 会话管理

### 数据隔离

- 用户数据完全隔离
- 基于用户ID的数据过滤
- 权限验证中间件

### 错误处理

- 统一错误响应格式
- 详细的错误日志
- 用户友好的错误提示

## 🔄 故障恢复

### 网络错误

- 自动重试机制
- 离线状态检测
- 本地缓存回退

### 数据同步

- 冲突检测
- 版本控制
- 增量同步

### 备份恢复

- 定期数据备份
- 导出/导入功能
- 数据验证机制

## 📈 性能优化

### 前端优化

- 虚拟滚动
- 懒加载
- 缓存策略

### 后端优化

- 数据库索引
- 查询优化
- 分页加载

### 网络优化

- 请求合并
- 压缩传输
- CDN 加速

## 🎉 优势总结

1. **数据安全**: 服务器端存储，不会丢失
2. **多设备同步**: 任何设备都能访问相同数据
3. **协作功能**: 为未来的团队协作做准备
4. **扩展性**: 支持更多高级功能
5. **备份恢复**: 完整的数据备份和恢复机制
6. **性能提升**: 更好的数据管理和查询性能
