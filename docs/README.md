# Wendeal Reports

> 个人深度研究报告汇总平台

一个基于 Next.js 14 + TypeScript + Tailwind CSS 构建的现代化报告管理系统，专为个人研究报告的收集、整理、搜索和展示而设计。

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.9.0-2D3748.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.0-38B2AC.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 项目概述

Wendeal Reports 是一个现代化的报告管理和查看平台，专为个人深度研究报告的汇总、管理和展示而设计。采用黑白灰简约设计风格，提供直观的浏览和搜索体验。

## ✨ 主要功能

### 🎯 已实现功能 (v0.1)

- **🗂️ 分类管理**: 树状结构的报告分类系统
- **📖 报告查看**: 内嵌HTML报告直接预览
- **🔍 实时搜索**: 支持报告标题、内容、标签搜索
- **⭐ 收藏系统**: 收藏常用报告，快速访问
- **📊 阅读状态**: 跟踪报告阅读进度
- **🌓 主题切换**: 支持明暗主题无缝切换
- **📱 响应式设计**: 适配桌面端和移动端

### 🚀 技术特性

- **现代化架构**: Next.js 14 + TypeScript + Tailwind CSS
- **数据库**: Prisma ORM + SQLite
- **组件化设计**: shadcn/ui 组件库
- **状态管理**: Zustand 轻量级状态管理
- **性能优化**: Server Components + 自动代码分割
- **类型安全**: 完整的 TypeScript 类型定义
- **容器化部署**: Docker + Docker Compose
- **安全认证**: JWT + bcrypt 加密

## 🏗️ 项目结构

```
wendeal-reports/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API 路由
│   │   ├── dashboard/      # 主要dashboard页面
│   │   ├── login/          # 登录页面
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页重定向
│   ├── components/         # React组件
│   │   ├── ui/            # shadcn/ui组件
│   │   ├── sidebar/       # 侧边栏组件
│   │   ├── report-viewer/ # 报告查看器
│   │   ├── search/        # 搜索组件
│   │   ├── upload/        # 文件上传组件
│   │   └── pdf/           # PDF查看器
│   ├── lib/               # 工具函数
│   │   ├── api-client.ts  # API客户端
│   │   ├── auth.ts        # 认证逻辑
│   │   ├── prisma.ts      # 数据库连接
│   │   └── utils.ts       # 通用工具
│   ├── types/             # TypeScript类型
│   ├── store/             # Zustand状态管理
│   └── hooks/             # 自定义Hooks
├── prisma/                # 数据库配置
│   ├── schema.prisma      # 数据库模式
│   └── dev.db            # SQLite数据库
├── public/                # 静态资源
│   └── reports/          # 报告文件
├── scripts/               # 部署脚本
├── docker-compose.yml     # Docker配置
├── Dockerfile            # Docker镜像
└── DOCKER_DEPLOYMENT.md  # 部署文档
```

## 🚀 快速开始

### 方法一：Docker 部署（推荐）

#### 环境要求
- Docker Engine 20.10+
- Docker Compose 2.0+

#### 一键部署

**Windows 用户：**
```cmd
git clone https://github.com/Wendealai/wendeal-reports.git
cd wendeal-reports
deploy.bat dev    # 开发环境
deploy.bat prod   # 生产环境
```

**Linux/Mac 用户：**
```bash
git clone https://github.com/Wendealai/wendeal-reports.git
cd wendeal-reports
chmod +x deploy.sh
./deploy.sh dev   # 开发环境
./deploy.sh prod  # 生产环境
```

**手动部署：**
```bash
git clone https://github.com/Wendealai/wendeal-reports.git
cd wendeal-reports
cp env.example .env
# 编辑 .env 文件，设置 JWT_SECRET
docker-compose up -d --build
```

**访问应用：** http://localhost:7575

### 方法二：本地开发

#### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

#### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/Wendealai/wendeal-reports.git
cd wendeal-reports
```

2. **安装依赖**
```bash
npm install
```

3. **配置数据库**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### Docker 管理命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f wendeal-reports

# 重启应用
docker-compose restart wendeal-reports

# 停止应用
docker-compose down

# 更新应用
git pull origin master
docker-compose up -d --build

# 健康检查
curl http://localhost:7575/api/health
```

### 本地开发脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 数据库操作
npx prisma generate    # 生成客户端
npx prisma migrate dev  # 运行迁移
npx prisma studio      # 数据库管理界面

# 代码检查
npm run lint

# 修复代码问题
npm run lint:fix

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 检查代码格式
npm run format:check

# 清理构建文件
npm run clean
```

## 📖 使用指南

### 上传报告
1. 点击仪表板的"上传文件"按钮
2. 选择或拖拽 HTML 格式的报告文件
3. 选择分类并确认上传
4. 系统自动解析文件内容和元数据

### 搜索报告
1. 使用顶部搜索栏进行全文搜索
2. 点击高级搜索使用多维度过滤
3. 保存常用搜索条件
4. 查看搜索历史记录

### 管理分类
1. 在侧边栏管理分类结构
2. 创建、编辑、删除分类
3. 设置分类颜色和描述
4. 拖拽调整分类顺序

### 批量操作
1. 启用批量选择模式
2. 选择多个报告
3. 执行批量操作（移动、收藏、删除等）

## 🐳 Docker 部署

### 生产环境部署

1. **服务器要求**
   - Docker Engine 20.10+
   - Docker Compose 2.0+
   - 至少2GB内存
   - 至少5GB磁盘空间

2. **安全配置**
   ```bash
   # 生成强JWT密钥
   openssl rand -base64 32
   
   # 配置防火墙
   sudo ufw allow 7575
   sudo ufw enable
   ```

3. **SSL证书（可选）**
   ```bash
   # 使用Let's Encrypt
   sudo certbot certonly --standalone -d your-domain.com
   ```

4. **部署应用**
   ```bash
   git clone https://github.com/Wendealai/wendeal-reports.git
   cd wendeal-reports
   cp env.example .env
   # 编辑 .env 文件设置 JWT_SECRET
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### 数据备份

```bash
# 备份数据库
docker-compose exec wendeal-reports cp /app/data/wendeal.db /app/data/backup-$(date +%Y%m%d).db

# 复制备份到主机
docker cp wendeal-reports-app:/app/data/backup-$(date +%Y%m%d).db ./
```

### 监控和维护

- **健康检查**: http://localhost:7575/api/health
- **日志查看**: `docker-compose logs -f wendeal-reports`
- **应用更新**: `git pull && docker-compose up -d --build`

详细部署指南请参考：[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

## 🎯 开发路线图

### Phase 1: 基础功能 ✅
- [x] 项目架构搭建
- [x] 基础 UI 组件库
- [x] 报告展示和管理

### Phase 2: 核心功能 ✅
- [x] 分类管理系统
- [x] 搜索和过滤功能
- [x] 文件上传和解析
- [x] 批量操作功能

### Phase 3: 高级功能 ✅
- [x] 数据持久化（Prisma + SQLite）
- [x] 用户认证系统
- [x] PDF文件支持
- [x] HTML描述渲染
- [x] Docker容器化部署

### Phase 4: 扩展功能 🚧
- [ ] 报告导出功能
- [ ] 标签管理系统
- [ ] 全文搜索优化
- [ ] 多用户权限管理
- [ ] 云端同步
- [ ] 移动端应用

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 编写清晰的提交信息
- 添加适当的注释和文档

## 📝 更新日志

### v2.0.0 (2024-12-17)
- 🐳 **Docker容器化支持**: 一键部署到任何服务器
- 🗄️ **数据库集成**: Prisma ORM + SQLite 数据持久化
- 🔐 **用户认证**: JWT + bcrypt 安全认证系统
- 📄 **PDF支持**: 内置PDF查看器
- 🎨 **HTML渲染**: 安全的HTML描述显示
- 🚀 **生产就绪**: 完整的错误处理和日志系统
- 📊 **健康检查**: 应用状态监控
- 🔧 **一键部署**: Windows/Linux 部署脚本

### v1.0.0 (2024-01-20)
- 🎉 首次发布
- ✨ 完整的报告管理系统
- 🔍 强大的搜索和过滤功能
- 📁 智能分类管理
- 🎨 现代化 UI 设计
- 📱 响应式布局支持

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 👨‍💻 作者

**Wendeal**

- GitHub: [@wendeal](https://github.com/wendeal)

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Prisma](https://www.prisma.io/) - 现代数据库工具包
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - UI 组件库
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [Lucide](https://lucide.dev/) - 图标库
- [Docker](https://www.docker.com/) - 容器化平台

---

<div align="center">
  <p>如果这个项目对您有帮助，请给它一个 ⭐️</p>
  <p>Made with ❤️ by Wendeal</p>
</div>
