# Wendeal Reports 快速部署脚本 / Quick Deployment Script
# 适用于 Windows PowerShell / For Windows PowerShell

param(
    [string]$Action = "start",
    [switch]$Verbose = $false
)

# 设置错误处理 / Set error handling
$ErrorActionPreference = "Stop"

# 颜色输出函数 / Color output functions
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

# 显示帮助信息 / Show help information
function Show-Help {
    Write-Host ""
    Write-Info "Wendeal Reports 部署脚本 / Deployment Script"
    Write-Host ""
    Write-Host "用法 / Usage:"
    Write-Host "  ./deploy.ps1 [选项] / [options]"
    Write-Host ""
    Write-Host "选项 / Options:"
    Write-Host "  start     - 启动服务 / Start services (默认 / default)"
    Write-Host "  stop      - 停止服务 / Stop services"
    Write-Host "  restart   - 重启服务 / Restart services"
    Write-Host "  build     - 重新构建镜像 / Rebuild images"
    Write-Host "  logs      - 查看日志 / View logs"
    Write-Host "  status    - 查看状态 / Check status"
    Write-Host "  clean     - 清理资源 / Clean resources"
    Write-Host "  backup    - 备份数据库 / Backup database"
    Write-Host "  init      - 初始化部署 / Initialize deployment"
    Write-Host "  help      - 显示帮助 / Show help"
    Write-Host ""
    Write-Host "示例 / Examples:"
    Write-Host "  ./deploy.ps1 init      # 首次部署 / First deployment"
    Write-Host "  ./deploy.ps1 start     # 启动服务 / Start services"
    Write-Host "  ./deploy.ps1 logs      # 查看日志 / View logs"
    Write-Host ""
}

# 检查先决条件 / Check prerequisites
function Test-Prerequisites {
    Write-Info "检查系统要求 / Checking system requirements..."
    
    # 检查 Docker / Check Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker 已安装 / Docker installed: $dockerVersion"
    }
    catch {
        Write-Error "Docker 未安装或未启动 / Docker not installed or not running"
        Write-Info "请从以下地址下载并安装 Docker Desktop / Please download and install Docker Desktop from:"
        Write-Info "https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    # 检查 Docker Compose / Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose 已安装 / Docker Compose installed: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose 未安装 / Docker Compose not installed"
        exit 1
    }
    
    # 检查必要文件 / Check required files
    $requiredFiles = @("Dockerfile", "docker-compose.yml", ".env.docker")
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Success "文件存在 / File exists: $file"
        }
        else {
            Write-Error "缺少必要文件 / Missing required file: $file"
            exit 1
        }
    }
}

# 初始化部署 / Initialize deployment
function Initialize-Deployment {
    Write-Info "初始化部署环境 / Initializing deployment environment..."
    
    # 创建环境文件 / Create environment file
    if (-not (Test-Path ".env")) {
        Write-Info "创建环境配置文件 / Creating environment configuration file..."
        Copy-Item ".env.docker" ".env"
        Write-Success "环境文件已创建 / Environment file created: .env"
        Write-Warning "请检查并修改 .env 文件中的配置 / Please review and modify configurations in .env file"
    }
    
    # 创建数据目录 / Create data directories
    $dataDirs = @("data", "data\postgres", "data\uploads", "data\logs", "backups")
    foreach ($dir in $dataDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "目录已创建 / Directory created: $dir"
        }
    }
    
    Write-Success "初始化完成 / Initialization completed"
}

# 启动服务 / Start services
function Start-Services {
    Write-Info "启动 Wendeal Reports 服务 / Starting Wendeal Reports services..."
    
    try {
        docker-compose up -d
        Write-Success "服务启动成功 / Services started successfully"
        
        Write-Info "等待服务完全启动 / Waiting for services to fully start..."
        Start-Sleep -Seconds 30
        
        Write-Info "初始化数据库 / Initializing database..."
        docker-compose exec app npx prisma migrate deploy
        
        Write-Success "部署完成 / Deployment completed"
        Write-Info "应用访问地址 / Application URL: http://localhost:11280"
    }
    catch {
        Write-Error "服务启动失败 / Failed to start services: $($_.Exception.Message)"
        exit 1
    }
}

# 停止服务 / Stop services
function Stop-Services {
    Write-Info "停止服务 / Stopping services..."
    try {
        docker-compose down
        Write-Success "服务已停止 / Services stopped"
    }
    catch {
        Write-Error "停止服务失败 / Failed to stop services: $($_.Exception.Message)"
    }
}

# 重启服务 / Restart services
function Restart-Services {
    Write-Info "重启服务 / Restarting services..."
    Stop-Services
    Start-Sleep -Seconds 5
    Start-Services
}

# 重新构建 / Rebuild
function Build-Images {
    Write-Info "重新构建镜像 / Rebuilding images..."
    try {
        docker-compose build --no-cache
        Write-Success "镜像构建完成 / Images built successfully"
    }
    catch {
        Write-Error "镜像构建失败 / Failed to build images: $($_.Exception.Message)"
    }
}

# 查看日志 / View logs
function Show-Logs {
    Write-Info "显示应用日志 / Showing application logs..."
    docker-compose logs -f app
}

# 查看状态 / Check status
function Show-Status {
    Write-Info "检查服务状态 / Checking service status..."
    docker-compose ps
    
    Write-Host ""
    Write-Info "容器资源使用情况 / Container resource usage:"
    docker stats --no-stream
}

# 清理资源 / Clean resources
function Clean-Resources {
    Write-Warning "这将删除所有容器和镜像，但保留数据卷 / This will remove all containers and images but keep data volumes"
    $confirm = Read-Host "确认继续? (y/N) / Confirm to continue? (y/N)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Info "清理 Docker 资源 / Cleaning Docker resources..."
        docker-compose down --rmi all
        docker system prune -f
        Write-Success "清理完成 / Cleanup completed"
    }
    else {
        Write-Info "操作已取消 / Operation cancelled"
    }
}

# 备份数据库 / Backup database
function Backup-Database {
    Write-Info "备份数据库 / Backing up database..."
    
    $backupDir = "backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$backupDir\backup_$timestamp.sql"
    
    try {
        docker-compose exec postgres pg_dump -U wendeal wendeal_reports > $backupFile
        Write-Success "数据库备份完成 / Database backup completed: $backupFile"
    }
    catch {
        Write-Error "数据库备份失败 / Database backup failed: $($_.Exception.Message)"
    }
}

# 主逻辑 / Main logic
function Main {
    Write-Host ""
    Write-Info "Wendeal Reports Docker 部署工具 / Docker Deployment Tool"
    Write-Host ""
    
    switch ($Action.ToLower()) {
        "help" { Show-Help }
        "init" { 
            Test-Prerequisites
            Initialize-Deployment
        }
        "start" { 
            Test-Prerequisites
            Start-Services
        }
        "stop" { Stop-Services }
        "restart" { Restart-Services }
        "build" { Build-Images }
        "logs" { Show-Logs }
        "status" { Show-Status }
        "clean" { Clean-Resources }
        "backup" { Backup-Database }
        default { 
            Write-Error "未知操作 / Unknown action: $Action"
            Show-Help
            exit 1
        }
    }
}

# 运行主函数 / Run main function
try {
    Main
}
catch {
    Write-Error "脚本执行失败 / Script execution failed: $($_.Exception.Message)"
    exit 1
}
