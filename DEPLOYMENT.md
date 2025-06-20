# Netlify 部署指南

## 项目状态 ✅

此项目已完全优化用于Netlify部署：
- ✅ 移除了所有PDF依赖问题
- ✅ 配置了正确的构建命令
- ✅ 设置了环境变量管理
- ✅ 本地构建测试通过

## 快速部署步骤

### 1. 连接GitHub仓库

1. 登录 [Netlify Dashboard](https://app.netlify.com/)
2. 点击 **"New site from Git"**
3. 选择 **GitHub**，授权连接
4. 选择仓库：`Wendealai/wendeal-reports`
5. 选择分支：`main`

### 2. 配置构建设置

**重要：** 在部署设置中确保使用：

```
Build command: npm run build:netlify
Publish directory: .next
```

如果Netlify自动检测设置不正确，请手动修改。

### 3. 设置环境变量

在 **Site settings > Environment variables** 中添加：

```
DATABASE_URL=file:./dev.db
JWT_SECRET=your-32-character-random-secret-here
NEXTAUTH_URL=https://your-site-name.netlify.app
NEXTAUTH_SECRET=another-32-character-random-secret
```

**生成随机密钥：**
```bash
# 使用Node.js生成32字符随机字符串
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 部署

1. 点击 **"Deploy site"**
2. 等待构建完成（约2-5分钟）
3. 如果失败，检查构建日志

## 常见问题解决

### Q: 构建时出现PDF worker错误
**A:** 此问题已修复。如果仍出现，请：
1. 在Netlify中清除缓存并重新部署
2. 确保使用的是最新代码（commit: 0abb423）

### Q: 环境变量警告
**A:** 这是正常的，构建会成功完成。确保在Netlify UI中设置了必要的环境变量。

### Q: 数据库错误
**A:** 初次部署时：
1. 访问 `https://your-site.netlify.app/api/migrate` 初始化数据库
2. 或访问主页，系统会自动初始化

### Q: 构建命令错误
**A:** 确保在Netlify设置中使用 `npm run build:netlify` 而不是默认的 `npm run build`

## 项目特性

- **现代化架构**: Next.js 14 + TypeScript + Tailwind CSS
- **数据库**: SQLite with Prisma ORM
- **身份验证**: JWT based authentication
- **文件支持**: HTML报告上传和预览
- **响应式设计**: 完美适配移动端和桌面端
- **分类管理**: 智能分类和标签系统

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建测试
npm run build:netlify
```

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, Radix UI
- **数据库**: Prisma + SQLite
- **部署**: Netlify
- **身份验证**: JWT
- **状态管理**: Zustand

## 支持

如有问题，请检查：
1. [项目文档](./docs/)
2. [GitHub Issues](https://github.com/Wendealai/wendeal-reports/issues)
3. Netlify构建日志

---

**最后更新**: 2024年 - 项目已完全准备好Netlify部署 🚀 