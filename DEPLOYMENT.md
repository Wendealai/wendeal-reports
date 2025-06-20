# Netlify 部署指南

本项目已经配置好可以直接部署到 Netlify。

## 🚀 一键部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/wendeal-reports)

## 📋 手动部署步骤

### 1. 准备代码仓库

```bash
# 将代码推送到 GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/wendeal-reports.git
git push -u origin main
```

### 2. 连接到 Netlify

1. 登录 [Netlify](https://netlify.com)
2. 点击 "New site from Git"
3. 选择 GitHub 并授权
4. 选择你的仓库

### 3. 配置构建设置

Netlify 会自动检测到 `netlify.toml` 配置文件，但你也可以手动配置：

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `netlify/functions`

### 4. 设置环境变量

在 Netlify 的 Site settings > Environment variables 中添加：

```
NODE_ENV=production
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=https://your-site.netlify.app
NEXTAUTH_SECRET=your-secret-key-here
```

### 5. 部署

点击 "Deploy site"，Netlify 将自动构建和部署你的应用。

## 🔧 高级配置

### 自定义域名

1. 在 Site settings > Domain management 中
2. 添加你的自定义域名
3. 配置 DNS 记录

### 环境分支

- `main` 分支 → 生产环境
- `develop` 分支 → 预览环境

### 函数配置

项目已包含 Netlify 函数在 `netlify/functions` 目录中：

- `auth-login.mts` - 用户认证
- `categories.mts` - 分类管理
- `reports.mts` - 报告管理
- `init-db.mts` - 数据库初始化

## 🐛 常见问题

### 构建失败

1. 检查 Node.js 版本（需要 >= 18）
2. 确保所有依赖都在 `package.json` 中
3. 检查环境变量设置

### 数据库连接问题

- 确保 `DATABASE_URL` 环境变量正确设置
- Netlify 使用 SQLite，确保 Prisma 配置正确

### API 路由404

- 检查 `netlify.toml` 中的重定向规则
- 确保 Netlify 函数正确部署

## 📊 监控和分析

- 在 Netlify Dashboard 查看部署日志
- 使用 Netlify Analytics 监控访问情况
- 配置 Error tracking（可选）

## 🔄 持续部署

推送到 main 分支将自动触发重新部署：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 📞 支持

如果遇到部署问题，请检查：

1. [Netlify 文档](https://docs.netlify.com/)
2. [Next.js on Netlify 指南](https://docs.netlify.com/frameworks/next-js/)
3. 项目的 [Issues](https://github.com/your-username/wendeal-reports/issues) 