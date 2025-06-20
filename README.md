# Wendeal Reports

> 个人深度研究报告汇总平台

一个基于 Next.js 14 + TypeScript + Tailwind CSS 构建的现代化报告管理系统，专为个人研究报告的收集、整理、搜索和展示而设计。

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.0-38B2AC.svg)

## ✨ 主要功能

- **🗂️ 分类管理**: 树状结构的报告分类系统
- **📖 报告查看**: 内嵌HTML报告直接预览
- **🔍 实时搜索**: 支持报告标题、内容、标签搜索
- **⭐ 收藏系统**: 收藏常用报告，快速访问
- **📊 阅读状态**: 跟踪报告阅读进度
- **🌓 主题切换**: 支持明暗主题无缝切换
- **📱 响应式设计**: 适配桌面端和移动端

## 🏗️ 项目结构

```
wendeal-reports/
├── src/                    # 源代码
│   ├── app/               # Next.js App Router
│   ├── components/        # React组件
│   ├── lib/              # 工具函数和配置
│   ├── types/            # TypeScript类型定义
│   └── store/            # 状态管理
├── public/               # 静态资源
├── prisma/              # 数据库配置
├── netlify/             # Netlify函数
├── docs/                # 项目文档
├── deployment/          # 部署配置和脚本
└── tests/               # 测试文件
```

## 🚀 快速开始

### 本地开发

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
```bash
cp env.example .env
# 编辑 .env 文件设置你的配置
```

3. **初始化数据库**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开 [http://localhost:3000](http://localhost:3000)

### Netlify 部署

1. **连接到 Netlify**
   - 将代码推送到 GitHub 仓库
   - 在 Netlify 中连接你的 GitHub 仓库

2. **配置环境变量**
   在 Netlify 的站点设置中添加必要的环境变量（参考 `env.example`）

3. **自动部署**
   推送代码后 Netlify 将自动构建和部署

## 📝 开发脚本

```bash
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run type-check   # TypeScript 类型检查
```

## 📚 文档

- [部署指南](./docs/NETLIFY_DEPLOYMENT_GUIDE.md)
- [API 文档](./docs/api-design.md)
- [数据库设计](./docs/database-schema.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](./LICENSE) 