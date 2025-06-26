# Wendeal Reports Docker 部署指南 / Docker Deployment Guide

本指南提供了使用 Docker 部署 Wendeal Reports 应用程序的详细说明。
This guide provides detailed instructions for deploying the Wendeal Reports application using Docker.

## 目录 / Table of Contents

1. [系统要求 / System Requirements](#系统要求--system-requirements)
2. [安装步骤 / Installation Steps](#安装步骤--installation-steps)
3. [环境配置 / Environment Configuration](#环境配置--environment-configuration)
4. [部署应用 / Deploy Application](#部署应用--deploy-application)
5. [数据库管理 / Database Management](#数据库管理--database-management)
6. [故障排除 / Troubleshooting](#故障排除--troubleshooting)
7. [生产环境配置 / Production Configuration](#生产环境配置--production-configuration)

## 系统要求 / System Requirements

### 必需组件 / Required Components

1. **Docker Desktop** (版本 4.0+ / Version 4.0+)
   - Windows: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
   - 包含 Docker Compose / Includes Docker Compose
   - 至少需要 4GB RAM / Minimum 4GB RAM required

2. **Git** (版本 2.0+ / Version 2.0+)
   - 下载地址 / Download: [Git官网 / Git Official Site](https://git-scm.com/)

3. **PowerShell** (Windows 自带 / Built-in on Windows)
   - PowerShell 5.1+ 或 PowerShell Core 7+

### 硬件要求 / Hardware Requirements

- **内存 / RAM**: 至少 8GB (推荐 16GB / Recommended 16GB)
- **存储 / Storage**: 至少 10GB 可用空间 / Minimum 10GB free space
- **CPU**: 2核心以上 / 2+ cores
- **网络 / Network**: 稳定的网络连接用于下载镜像 / Stable connection for image downloads

## 安装步骤 / Installation Steps

### 第一步：安装 Docker Desktop / Step 1: Install Docker Desktop

1. 下载并安装 Docker Desktop / Download and install Docker Desktop
2. 启动 Docker Desktop 并确保其正在运行 / Start Docker Desktop and ensure it's running
3. 验证安装 / Verify installation:

```powershell
# 检查 Docker 版本 / Check Docker version
docker --version

# 检查 Docker Compose 版本 / Check Docker Compose version
docker-compose --version
```

### 第二步：克隆项目 / Step 2: Clone Project

```powershell
# 打开 PowerShell 终端 / Open PowerShell terminal
# 导航到目标目录 / Navigate to target directory
cd C:\Users\Wendeal

# 克隆仓库 / Clone repository
git clone https://github.com/wendeal/wendeal-reports.git

# 进入项目目录 / Enter project directory
cd wendeal-reports
```

### 第三步：验证项目文件 / Step 3: Verify Project Files

```powershell
# 检查必要文件是否存在 / Check if necessary files exist
dir Dockerfile
dir docker-compose.yml
dir .env.docker
```

## 环境配置 / Environment Configuration

### 配置环境变量 / Configure Environment Variables

1. **复制环境配置文件 / Copy environment configuration file**:

```powershell
# 复制 Docker 环境配置 / Copy Docker environment configuration
copy .env.docker .env
```

2. **编辑环境变量 / Edit environment variables** (可选 / Optional):

打开 `.env` 文件并根据需要修改以下变量 / Open `.env` file and modify the following variables as needed:

```bash
# 数据库密码 / Database password
DB_PASSWORD=wendeal123456

# 认证密钥 (生产环境必须更改) / Authentication secret (MUST change in production)
NEXTAUTH_SECRET=your-super-secret-key-change-in-production-please

# 应用访问地址 / Application access URL
NEXTAUTH_URL=http://localhost:11280

# 数据存储路径 / Data storage path
DATA_PATH=./data
```

### 创建数据目录 / Create Data Directories

```powershell
# 创建必要的数据目录 / Create necessary data directories
New-Item -ItemType Directory -Path "data" -Force
New-Item -ItemType Directory -Path "data\postgres" -Force
New-Item -ItemType Directory -Path "data\uploads" -Force
New-Item -ItemType Directory -Path "data\logs" -Force
```

## 部署应用 / Deploy Application

### 特殊配置：ZimaOS 只读根目录 / Special Configuration: ZimaOS Read-only Root

如果您在 ZimaOS 或其他只读根目录系统上部署，请先执行以下步骤：
If deploying on ZimaOS or other read-only root systems, execute the following steps first:

#### 方法1：使用自动化部署脚本 / Method 1: Use Automated Deployment Script

```bash
# 进入项目目录 / Enter project directory
cd /DATA/wendeal-reports

# 运行 ZimaOS 专用部署脚本 / Run ZimaOS-specific deployment script
chmod +x scripts/deploy-zimaos.sh
./scripts/deploy-zimaos.sh
```

#### 方法2：手动配置 / Method 2: Manual Configuration

```bash
# 设置 Docker 配置目录到 /DATA / Set Docker config directory to /DATA
export DOCKER_CONFIG=/DATA/.docker
mkdir -p /DATA/.docker

# 确保在 /DATA 目录下操作 / Ensure operating in /DATA directory
cd /DATA/wendeal-reports

# 然后继续常规部署步骤 / Then continue with regular deployment steps
```

### 方式一：快速部署 / Method 1: Quick Deployment

```powershell
# 构建并启动所有服务 / Build and start all services
docker-compose up -d

# 查看启动状态 / Check startup status
docker-compose ps
```

### 方式二：分步部署 / Method 2: Step-by-step Deployment

```powershell
# 1. 构建镜像 / Build images
docker-compose build

# 2. 启动数据库 / Start database
docker-compose up -d postgres

# 3. 等待数据库启动 / Wait for database to start
timeout 30

# 4. 启动应用 / Start application
docker-compose up -d app

# 5. 检查服务状态 / Check service status
docker-compose logs -f
```

## 数据库管理 / Database Management

### 初始化数据库 / Initialize Database

```powershell
# 等待应用完全启动 / Wait for application to fully start
timeout 60

# 运行数据库迁移 / Run database migrations
docker-compose exec app npx prisma migrate deploy

# 生成 Prisma 客户端 / Generate Prisma client
docker-compose exec app npx prisma generate

# (可选) 查看数据库状态 / (Optional) Check database status
docker-compose exec app npx prisma db push
```

### 数据库备份与恢复 / Database Backup and Restore

#### 备份数据库 / Backup Database

```powershell
# 创建备份目录 / Create backup directory
New-Item -ItemType Directory -Path "backups" -Force

# 备份数据库 / Backup database
docker-compose exec postgres pg_dump -U wendeal wendeal_reports > backups\backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

#### 恢复数据库 / Restore Database

```powershell
# 恢复数据库 / Restore database
docker-compose exec -T postgres psql -U wendeal wendeal_reports < backups\your_backup_file.sql
```

## 访问应用 / Access Application

### 应用地址 / Application URLs

- **主应用 / Main Application**: [http://localhost:11280](http://localhost:11280)
- **健康检查 / Health Check**: [http://localhost:11280/api/health](http://localhost:11280/api/health)

### 检查服务状态 / Check Service Status

```powershell
# 查看所有容器状态 / View all container status
docker-compose ps

# 查看应用日志 / View application logs
docker-compose logs -f app

# 查看数据库日志 / View database logs
docker-compose logs -f postgres

# 实时监控资源使用 / Monitor resource usage in real-time
docker stats
```

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

#### 1. 端口冲突 / Port Conflicts

如果端口 11280 被占用 / If port 11280 is in use:

```powershell
# 检查端口占用 / Check port usage
netstat -ano | findstr :11280

# 修改 docker-compose.yml 中的端口映射 / Modify port mapping in docker-compose.yml
# 将 "11280:11280" 改为 "8080:11280" 或其他可用端口
```

#### 2. 内存不足 / Insufficient Memory

```powershell
# 检查 Docker 内存限制 / Check Docker memory limits
docker system df
docker system prune -f

# 清理不使用的镜像和容器 / Clean unused images and containers
docker image prune -f
docker container prune -f
```

#### 3. 数据库连接问题 / Database Connection Issues

```powershell
# 检查数据库容器状态 / Check database container status
docker-compose logs postgres

# 重启数据库服务 / Restart database service
docker-compose restart postgres

# 检查数据库连接 / Test database connection
docker-compose exec postgres psql -U wendeal -d wendeal_reports -c "\dt"
```

#### 4. 应用无法启动 / Application Won't Start

```powershell
# 查看详细错误日志 / View detailed error logs
docker-compose logs --tail=100 app

# 重新构建镜像 / Rebuild images
docker-compose build --no-cache app

# 完全重启服务 / Completely restart services
docker-compose down
docker-compose up -d
```

### 日志管理 / Log Management

```powershell
# 查看最近的日志 / View recent logs
docker-compose logs --tail=50 app

# 持续监控日志 / Continuously monitor logs
docker-compose logs -f app

# 导出日志到文件 / Export logs to file
docker-compose logs app > logs\app_$(Get-Date -Format "yyyyMMdd_HHmmss").log
```

## 生产环境配置 / Production Configuration

### 安全配置 / Security Configuration

1. **更改默认密码 / Change Default Passwords**:

```bash
# 在 .env 文件中 / In .env file
DB_PASSWORD=your_secure_password_here
NEXTAUTH_SECRET=your_very_secure_secret_key_here
```

2. **配置 HTTPS / Configure HTTPS** (推荐使用 Nginx 反向代理 / Recommended with Nginx reverse proxy)

3. **防火墙设置 / Firewall Settings**:

```powershell
# 只允许必要的端口 / Only allow necessary ports
# 11280 (应用端口 / Application port)
# 5432 (数据库端口，仅内部访问 / Database port, internal only)
```

### 性能优化 / Performance Optimization

1. **调整资源限制 / Adjust Resource Limits**:

在 `docker-compose.yml` 中修改 / Modify in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '1.0'
    reservations:
      memory: 1G
      cpus: '0.5'
```

2. **数据库优化 / Database Optimization**:

```sql
-- 在数据库中执行 / Execute in database
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

### 监控和维护 / Monitoring and Maintenance

```powershell
# 定期清理 Docker 资源 / Regular Docker resource cleanup
docker system prune -f

# 定期备份数据 / Regular data backup
# 建议设置定时任务 / Recommend setting up scheduled tasks

# 检查磁盘使用 / Check disk usage
docker system df

# 监控应用性能 / Monitor application performance
docker stats wendeal-reports-app
```

## 停止和清理 / Stop and Cleanup

### 停止服务 / Stop Services

```powershell
# 停止所有服务 / Stop all services
docker-compose down

# 停止服务并删除卷 (注意：会删除数据) / Stop services and remove volumes (WARNING: Will delete data)
docker-compose down -v

# 停止服务并删除镜像 / Stop services and remove images
docker-compose down --rmi all
```

### 完全清理 / Complete Cleanup

```powershell
# 停止并删除所有相关资源 / Stop and remove all related resources
docker-compose down -v --rmi all

# 删除本地数据目录 / Remove local data directories
Remove-Item -Recurse -Force data\

# 清理 Docker 系统 / Clean Docker system
docker system prune -af
```

## 升级和更新 / Upgrade and Update

### 更新应用 / Update Application

```powershell
# 1. 备份当前数据 / Backup current data
docker-compose exec postgres pg_dump -U wendeal wendeal_reports > backups\pre_update_backup.sql

# 2. 停止服务 / Stop services
docker-compose down

# 3. 拉取最新代码 / Pull latest code
git pull origin main

# 4. 重新构建镜像 / Rebuild images
docker-compose build --no-cache

# 5. 启动服务 / Start services
docker-compose up -d

# 6. 运行数据库迁移 / Run database migrations
docker-compose exec app npx prisma migrate deploy
```

## 联系支持 / Contact Support

如遇到问题，请参考以下资源 / If you encounter issues, please refer to the following resources:

- **项目仓库 / Project Repository**: [GitHub](https://github.com/wendeal/wendeal-reports)
- **问题报告 / Issue Reporting**: [GitHub Issues](https://github.com/wendeal/wendeal-reports/issues)
- **文档 / Documentation**: 项目 README 文件 / Project README file

---

**祝您部署成功！/ Happy Deployment! 🎉**
