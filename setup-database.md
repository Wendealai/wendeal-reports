# 数据库设置指南

## 步骤 1: 创建免费的 PostgreSQL 数据库

### 使用 Neon (推荐)
1. 访问 https://neon.tech
2. 使用 GitHub 账户登录
3. 创建新项目
4. 选择区域（推荐 US East 1）
5. 数据库名称: `wendeal_reports`
6. 复制连接字符串

### 使用 Vercel Postgres (替代方案)
1. 在 Vercel 项目页面
2. 进入 Storage 标签
3. 创建 PostgreSQL 数据库
4. 复制连接字符串

## 步骤 2: 配置 Vercel 环境变量

1. 进入 Vercel 项目设置页面:
   https://vercel.com/wen-zhongs-projects/wendeal-reports/settings/environment-variables

2. 添加以下环境变量:

```
DATABASE_URL = postgresql://username:password@hostname/database?sslmode=require
DIRECT_URL = postgresql://username:password@hostname/database?sslmode=require
NODE_ENV = production
NEXTAUTH_SECRET = 生成一个安全的密钥
NEXTAUTH_URL = https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app
```

## 步骤 3: 生成 NEXTAUTH_SECRET
运行以下命令生成安全密钥:
```bash
openssl rand -base64 32
```

## 步骤 4: 部署数据库表结构
在本地运行:
```bash
npx prisma db push
```
