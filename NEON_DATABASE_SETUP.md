# Neon PostgreSQL数据库配置指南

> Context7推荐的完整Neon + Netlify部署配置

## 📋 概述

本项目使用Neon PostgreSQL作为生产数据库，支持Netlify无服务器部署。本指南将引导您完成完整的配置过程。

## 🎯 为什么使用Neon？

基于Context7最佳实践，Neon数据库具有以下优势：
- ✅ **无服务器架构**：完美适配Netlify Functions
- ✅ **自动扩缩容**：根据流量自动调整资源
- ✅ **连接池支持**：避免连接数限制问题
- ✅ **PostgreSQL兼容**：支持完整的关系型数据库功能
- ✅ **免费额度**：提供充足的免费使用量

## 🚀 步骤1：创建Neon数据库

### 1.1 注册并创建项目
1. 访问 [Neon Console](https://console.neon.tech)
2. 登录或注册账户
3. 点击 "Create Project"
4. 选择区域（推荐选择离您用户最近的区域）
5. 设置项目名称（如：`wendeal-reports`）

### 1.2 获取连接字符串
创建项目后，您将获得两个重要的连接字符串：

**连接池版本（用于应用）：**
```
postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/database?sslmode=require
```

**直接连接版本（用于迁移）：**
```
postgresql://username:password@ep-xxx.region.aws.neon.tech/database?sslmode=require
```

> 💡 **关键区别**：连接池版本包含 `-pooler`，直接连接版本不包含。

## 🔧 步骤2：配置环境变量

### 2.1 Netlify环境变量配置

在Netlify Dashboard中，进入您的站点设置：

1. **Site settings** → **Environment variables**
2. 添加以下环境变量：

```bash
# 🔗 数据库连接（必需）
DATABASE_URL="postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/database?sslmode=require&connection_limit=1&pool_timeout=15&connect_timeout=15"

# 🔗 直接数据库连接（迁移用）
DIRECT_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/database?sslmode=require"

# 🔐 安全配置（必需）
JWT_SECRET="your-32-character-random-secret-here"
NEXTAUTH_SECRET="your-32-character-random-secret-here"
NEXTAUTH_URL="https://your-site-name.netlify.app"

# 👤 用户配置（可选）
DEFAULT_USER_ID="cmbusc9x00000x2w0fqyu591k"

# 🌍 环境配置
NODE_ENV="production"
```

### 2.2 本地开发环境变量

创建 `.env.local` 文件：

```bash
# 复制 env.example 为 .env.local
cp env.example .env.local
```

编辑 `.env.local`：
```bash
DATABASE_URL="postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/database?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/database?sslmode=require"
JWT_SECRET="your-development-secret"
NEXTAUTH_SECRET="your-development-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 🛠️ 步骤3：数据库初始化

### 3.1 本地测试连接

```bash
# 测试Neon连接
npm run test:neon

# 或直接运行
node scripts/test-neon-connection.js
```

### 3.2 运行数据库迁移

```bash
# 生成Prisma客户端
npx prisma generate

# 推送schema到数据库（首次）
npx prisma db push

# 或运行迁移（如果有迁移文件）
npx prisma migrate deploy
```

### 3.3 初始化数据

```bash
# 本地初始化
npm run db:init

# 或访问 Netlify 函数
# https://your-site-name.netlify.app/.netlify/functions/init-db
```

## ⚡ 步骤4：部署到Netlify

### 4.1 推送代码到GitHub
```bash
git add .
git commit -m "feat: 配置Neon PostgreSQL数据库"
git push origin main
```

### 4.2 在Netlify中连接GitHub仓库
1. 在Netlify Dashboard中点击 "Add new site"
2. 选择 "Import an existing project"
3. 连接您的GitHub仓库
4. 确认构建设置：
   - **Build command**: `npx prisma generate && npm run build`
   - **Publish directory**: `.next`

### 4.3 验证部署
部署完成后，访问：
- **主站点**: `https://your-site-name.netlify.app`
- **健康检查**: `https://your-site-name.netlify.app/api/health`
- **数据库初始化**: `https://your-site-name.netlify.app/.netlify/functions/init-db`

## 🔍 故障排除

### 常见问题与解决方案

#### 1. 连接超时错误
```
Error: P1001: Can't reach database server
```

**解决方案**：
- Neon数据库可能处于睡眠状态，等待5-10秒后重试
- 在DATABASE_URL中添加超时参数：`connect_timeout=15&pool_timeout=15`
- 检查Neon控制台中数据库状态

#### 2. 认证失败
```
Error: P1000: Authentication failed
```

**解决方案**：
- 检查DATABASE_URL中的用户名和密码
- 确认在Neon控制台中重置密码
- 验证连接字符串格式正确

#### 3. 数据库不存在
```
Error: P1003: Database does not exist
```

**解决方案**：
- 确认在Neon控制台中数据库名称正确
- 检查连接字符串中的数据库名称

#### 4. SSL连接问题
```
Error: SSL connection required
```

**解决方案**：
- 确保URL中包含 `sslmode=require`
- 验证Neon支持SSL连接

### 调试工具

#### 1. 连接测试脚本
```bash
# 运行完整的连接诊断
node scripts/test-neon-connection.js
```

#### 2. 健康检查API
```bash
curl https://your-site-name.netlify.app/api/health
```

#### 3. 数据库状态检查
访问：`/debug` 页面查看详细的数据库状态信息

## 🔐 安全最佳实践

### 1. 环境变量安全
- ✅ 使用强密码和随机密钥
- ✅ 定期轮换密钥
- ❌ 不要在代码中硬编码密钥
- ❌ 不要提交 `.env` 文件到Git

### 2. 数据库安全
- ✅ 使用SSL连接
- ✅ 定期备份数据
- ✅ 监控数据库访问日志
- ❌ 不要使用默认密码

### 3. 连接池配置
- Context7推荐配置：`connection_limit=1`（Netlify函数）
- 超时配置：`connect_timeout=15&pool_timeout=15`
- 定期清理空闲连接

## 📊 性能优化

### 1. Neon特定优化
- 使用连接池版本的URL（包含`-pooler`）
- 配置适当的超时时间
- 考虑地理位置选择最近的区域

### 2. Netlify函数优化
- 在函数外部实例化PrismaClient
- 不要显式调用 `$disconnect()`
- 设置合适的函数超时时间

### 3. 查询优化
- 使用索引优化查询
- 避免N+1查询问题
- 实施分页和限制

## 📚 有用链接

- [Neon文档](https://neon.tech/docs)
- [Prisma + Neon指南](https://neon.tech/docs/guides/prisma)
- [Netlify环境变量](https://docs.netlify.com/environment-variables/overview/)
- [Netlify函数](https://docs.netlify.com/functions/overview/)

## 🆘 获取帮助

如果遇到问题：

1. **检查日志**：在Netlify Dashboard中查看函数日志
2. **运行诊断**：使用本地测试脚本
3. **查看文档**：参考上述链接
4. **社区支持**：Neon Discord 或 Netlify 社区

---

> 📝 **提示**：配置完成后，建议运行完整的测试套件以确保所有功能正常工作。 