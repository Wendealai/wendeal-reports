#!/bin/bash

# Wendeal Reports 一键部署脚本
# 使用方法: ./deploy.sh [dev|prod]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Wendeal Reports 部署脚本${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_message "Docker 环境检查通过"
}

# 检查环境变量文件
check_env() {
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            print_warning ".env 文件不存在，正在从 env.example 创建..."
            cp env.example .env
            print_warning "请编辑 .env 文件并设置正确的环境变量，特别是 JWT_SECRET"
            print_warning "建议使用以下命令生成强密码: openssl rand -base64 32"
        else
            print_error "env.example 文件不存在，无法创建 .env 文件"
            exit 1
        fi
    else
        print_message "环境变量文件检查通过"
    fi
}

# 部署开发环境
deploy_dev() {
    print_message "开始部署开发环境..."
    
    # 停止现有容器
    docker-compose down 2>/dev/null || true
    
    # 构建并启动
    docker-compose up -d --build
    
    print_message "开发环境部署完成！"
    print_message "访问地址: http://localhost:7575"
}

# 部署生产环境
deploy_prod() {
    print_message "开始部署生产环境..."
    
    # 检查JWT_SECRET是否设置
    if grep -q "your-super-secret-jwt-key-change-this-in-production" .env; then
        print_error "请在 .env 文件中设置安全的 JWT_SECRET"
        print_error "使用命令生成: openssl rand -base64 32"
        exit 1
    fi
    
    # 停止现有容器
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # 构建并启动
    docker-compose -f docker-compose.prod.yml up -d --build
    
    print_message "生产环境部署完成！"
    print_message "访问地址: http://your-server-ip:7575"
}

# 显示状态
show_status() {
    print_message "容器状态:"
    docker-compose ps
    
    print_message "应用日志 (最近10行):"
    docker-compose logs --tail=10 wendeal-reports
    
    print_message "健康检查:"
    sleep 5
    curl -f http://localhost:7575/api/health || print_warning "健康检查失败，请检查应用状态"
}

# 主函数
main() {
    print_header
    
    # 检查参数
    MODE=${1:-dev}
    
    if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
        print_error "无效的部署模式: $MODE"
        echo "使用方法: $0 [dev|prod]"
        exit 1
    fi
    
    print_message "部署模式: $MODE"
    
    # 执行检查
    check_docker
    check_env
    
    # 部署
    if [ "$MODE" = "dev" ]; then
        deploy_dev
    else
        deploy_prod
    fi
    
    # 显示状态
    show_status
    
    print_message "部署完成！"
    
    if [ "$MODE" = "prod" ]; then
        print_warning "生产环境部署提醒:"
        print_warning "1. 配置防火墙规则"
        print_warning "2. 设置SSL证书"
        print_warning "3. 配置域名解析"
        print_warning "4. 定期备份数据"
    fi
}

# 运行主函数
main "$@" 