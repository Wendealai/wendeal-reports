#!/bin/bash

# Wendeal Reports ZimaOS 部署脚本
# 专门为 ZimaOS 只读根目录系统设计

set -e

echo "🚀 开始 Wendeal Reports ZimaOS 部署..."

# 检查是否在 ZimaOS 环境
if [ -d "/DATA" ]; then
    echo "✅ 检测到 ZimaOS 环境"
    
    # 设置 Docker 配置目录到 /DATA
    export DOCKER_CONFIG=/DATA/.docker
    mkdir -p /DATA/.docker
    echo "✅ Docker 配置目录设置完成: $DOCKER_CONFIG"
    
    # 确保在 /DATA 目录下操作
    if [[ ! "$PWD" =~ ^/DATA ]]; then
        echo "⚠️  当前不在 /DATA 目录下，请确保项目位于 /DATA 下"
        echo "当前目录: $PWD"
        echo "建议运行: cd /DATA/wendeal-reports && ./scripts/deploy-zimaos.sh"
        exit 1
    fi
else
    echo "⚠️  未检测到 ZimaOS 环境，继续常规部署..."
fi

# 检查必要文件
echo "🔍 检查必要文件..."
required_files=("docker-compose.yml" ".env.docker" "Dockerfile")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    fi
done
echo "✅ 必要文件检查完成"

# 复制环境配置文件
if [ ! -f ".env" ]; then
    echo "📋 复制环境配置文件..."
    cp .env.docker .env
    echo "✅ 环境配置文件已创建"
else
    echo "✅ 环境配置文件已存在"
fi

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p data/{postgres,uploads,logs}
echo "✅ 数据目录创建完成"

# 检查 Docker 和 Docker Compose
echo "🔍 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装或不在 PATH 中"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装或不在 PATH 中"
    exit 1
fi
echo "✅ Docker 环境检查完成"

# 停止现有服务（如果存在）
echo "🛑 停止现有服务..."
docker compose down --remove-orphans 2>/dev/null || true

# 构建并启动服务
echo "🏗️  构建并启动服务..."
docker compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker compose ps

# 检查应用健康状态
echo "🏥 检查应用健康状态..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "尝试 $attempt/$max_attempts: 检查健康状态..."
    
    # 检查健康端点
    if curl -f -s http://localhost:11280/api/health > /dev/null 2>&1; then
        echo "✅ 应用健康检查通过"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ 应用健康检查失败，查看日志:"
        docker compose logs app --tail=20
        exit 1
    fi
    
    echo "⏳ 等待应用启动... (${attempt}/${max_attempts})"
    sleep 10
    ((attempt++))
done

# 初始化数据库
echo "🗄️  初始化数据库..."
if curl -f -s -X POST http://localhost:11280/api/admin/init-database > /dev/null 2>&1; then
    echo "✅ 数据库初始化成功"
else
    echo "⚠️  数据库初始化可能失败，但应用会在首次上传时自动初始化"
fi

# 显示部署信息
echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 服务信息:"
echo "  - 应用地址: http://localhost:11280"
echo "  - 健康检查: http://localhost:11280/api/health"
echo "  - 数据库初始化: http://localhost:11280/api/admin/init-database"
echo ""
echo "📁 数据目录:"
echo "  - 数据库数据: ./data/postgres"
echo "  - 上传文件: ./data/uploads"
echo "  - 应用日志: ./data/logs"
echo ""
echo "🔧 管理命令:"
echo "  - 查看日志: docker compose logs -f"
echo "  - 停止服务: docker compose down"
echo "  - 重启服务: docker compose restart"
echo "  - 查看状态: docker compose ps"
echo ""

# 最终状态检查
echo "🔍 最终状态检查..."
docker compose ps
echo ""

# 测试文件上传功能
echo "🧪 可选: 测试文件上传功能"
echo "您可以访问 http://localhost:11280 并尝试上传一个 HTML 文件来验证系统功能"
echo ""

echo "✅ ZimaOS 部署脚本执行完成！"
