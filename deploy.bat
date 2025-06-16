@echo off
setlocal enabledelayedexpansion

REM Wendeal Reports Windows 部署脚本
REM 使用方法: deploy.bat [dev|prod]

echo ================================
echo   Wendeal Reports 部署脚本
echo ================================

REM 设置默认模式
set MODE=%1
if "%MODE%"=="" set MODE=dev

if not "%MODE%"=="dev" if not "%MODE%"=="prod" (
    echo [ERROR] 无效的部署模式: %MODE%
    echo 使用方法: %0 [dev^|prod]
    exit /b 1
)

echo [INFO] 部署模式: %MODE%

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安装，请先安装 Docker Desktop
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose 未安装，请先安装 Docker Compose
    exit /b 1
)

echo [INFO] Docker 环境检查通过

REM 检查环境变量文件
if not exist ".env" (
    if exist "env.example" (
        echo [WARNING] .env 文件不存在，正在从 env.example 创建...
        copy env.example .env
        echo [WARNING] 请编辑 .env 文件并设置正确的环境变量，特别是 JWT_SECRET
        echo [WARNING] 建议使用在线工具生成强密码
    ) else (
        echo [ERROR] env.example 文件不存在，无法创建 .env 文件
        exit /b 1
    )
) else (
    echo [INFO] 环境变量文件检查通过
)

REM 部署应用
if "%MODE%"=="dev" (
    echo [INFO] 开始部署开发环境...
    
    REM 停止现有容器
    docker-compose down 2>nul
    
    REM 构建并启动
    docker-compose up -d --build
    
    echo [INFO] 开发环境部署完成！
    echo [INFO] 访问地址: http://localhost:3000
) else (
    echo [INFO] 开始部署生产环境...
    
    REM 检查JWT_SECRET是否设置
    findstr /C:"your-super-secret-jwt-key-change-this-in-production" .env >nul
    if not errorlevel 1 (
        echo [ERROR] 请在 .env 文件中设置安全的 JWT_SECRET
        echo [ERROR] 建议使用在线密码生成器生成32位随机字符串
        exit /b 1
    )
    
    REM 停止现有容器
    docker-compose -f docker-compose.prod.yml down 2>nul
    
    REM 构建并启动
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo [INFO] 生产环境部署完成！
    echo [INFO] 访问地址: http://your-server-ip
)

REM 显示状态
echo [INFO] 容器状态:
docker-compose ps

echo [INFO] 应用日志 (最近10行):
docker-compose logs --tail=10 wendeal-reports

echo [INFO] 等待应用启动...
timeout /t 10 /nobreak >nul

echo [INFO] 健康检查:
curl -f http://localhost:3000/api/health 2>nul
if errorlevel 1 (
    echo [WARNING] 健康检查失败，请检查应用状态
) else (
    echo [INFO] 应用运行正常
)

echo [INFO] 部署完成！

if "%MODE%"=="prod" (
    echo [WARNING] 生产环境部署提醒:
    echo [WARNING] 1. 配置防火墙规则
    echo [WARNING] 2. 设置SSL证书
    echo [WARNING] 3. 配置域名解析
    echo [WARNING] 4. 定期备份数据
)

pause 