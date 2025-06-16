@echo off
echo ================================
echo   Docker 配置测试脚本
echo ================================

echo [INFO] 检查Docker环境...

REM 检查Docker
docker --version
if errorlevel 1 (
    echo [ERROR] Docker 未安装或未启动
    exit /b 1
)

REM 检查Docker Compose
docker-compose --version
if errorlevel 1 (
    echo [ERROR] Docker Compose 未安装
    exit /b 1
)

echo [INFO] Docker 环境正常

echo [INFO] 验证Dockerfile语法...
docker build --dry-run . >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Dockerfile 可能存在语法问题
) else (
    echo [INFO] Dockerfile 语法正确
)

echo [INFO] 验证docker-compose配置...
docker-compose config >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker-compose.yml 配置有误
    exit /b 1
) else (
    echo [INFO] docker-compose.yml 配置正确
)

echo [INFO] 检查必要文件...
if not exist "package.json" (
    echo [ERROR] package.json 不存在
    exit /b 1
)

if not exist "next.config.js" (
    echo [ERROR] next.config.js 不存在
    exit /b 1
)

if not exist "prisma\schema.prisma" (
    echo [ERROR] prisma\schema.prisma 不存在
    exit /b 1
)

echo [INFO] 所有必要文件存在

echo [INFO] 检查环境变量文件...
if not exist ".env" (
    if exist "env.example" (
        echo [INFO] 创建 .env 文件...
        copy env.example .env
    ) else (
        echo [ERROR] env.example 不存在
        exit /b 1
    )
)

echo [SUCCESS] Docker 配置测试通过！
echo [INFO] 您现在可以运行以下命令部署应用：
echo [INFO] 开发环境: deploy.bat dev
echo [INFO] 生产环境: deploy.bat prod
echo [INFO] 手动部署: docker-compose up -d --build

pause 