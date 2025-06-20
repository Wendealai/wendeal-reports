@echo off
echo ========================================
echo    Wendeal Reports - Vercel 部署脚本
echo ========================================
echo.

:: 检查是否安装了Vercel CLI
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Vercel CLI，正在安装...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo [错误] Vercel CLI安装失败，请手动安装：npm install -g vercel
        pause
        exit /b 1
    )
    echo [成功] Vercel CLI安装完成
    echo.
)

:: 检查是否已登录Vercel
echo [信息] 检查Vercel登录状态...
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 需要登录Vercel，请按照提示操作...
    vercel login
    if %errorlevel% neq 0 (
        echo [错误] Vercel登录失败
        pause
        exit /b 1
    )
)

echo [成功] Vercel已登录
echo.

:: 安装依赖
echo [信息] 安装项目依赖...
npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

:: 生成Prisma客户端
echo [信息] 生成Prisma客户端...
npx prisma generate
if %errorlevel% neq 0 (
    echo [警告] Prisma客户端生成失败，但继续部署...
)

:: 构建项目
echo [信息] 构建项目...
npm run build
if %errorlevel% neq 0 (
    echo [错误] 项目构建失败
    pause
    exit /b 1
)

echo [成功] 项目构建完成
echo.

:: 部署到Vercel
echo [信息] 开始部署到Vercel...
echo [提示] 如果是首次部署，请按照提示配置项目设置
echo.

vercel --prod
if %errorlevel% neq 0 (
    echo [错误] Vercel部署失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo           部署成功完成！
echo ========================================
echo.
echo [重要] 部署后需要设置环境变量：
echo 1. 访问 Vercel 控制台
echo 2. 进入项目设置 ^> Environment Variables
echo 3. 添加以下必需变量：
echo    - DATABASE_URL
echo    - JWT_SECRET
echo    - NODE_ENV=production
echo.
echo [提示] 详细说明请查看 VERCEL_DEPLOYMENT_GUIDE.md
echo.
pause 