# 🔧 GitHub Actions Setup Guide

本指南将帮助你配置 GitHub Actions 工作流，实现自动化的数据库分支管理和部署预览。

## 📋 **前置要求**

- ✅ Neon 账号和项目
- ✅ GitHub 仓库管理员权限
- ✅ Netlify 账号（用于部署）

## 🔑 **第一步：获取 Neon API 密钥**

### 1. 获取 API 密钥

1. 登录 [Neon Console](https://console.neon.tech)
2. 进入你的项目
3. 点击 "Settings" → "API Keys"
4. 点击 "Create API Key"
5. 复制生成的 API 密钥

### 2. 获取项目 ID

1. 在 Neon Console 中，项目 ID 显示在项目名称下方
2. 格式类似：`ep-cool-darkness-123456`
3. 复制这个项目 ID

## ⚙️ **第二步：配置 GitHub Secrets 和 Variables**

### 1. 添加 Secrets

在 GitHub 仓库中：

1. 进入 "Settings" → "Secrets and variables" → "Actions"
2. 点击 "New repository secret"
3. 添加以下 secret：

```
Name: NEON_API_KEY
Value: 你的Neon API密钥
```

### 2. 添加 Variables

在同一页面，点击 "Variables" 标签：

1. 点击 "New repository variable"
2. 添加以下 variable：

```
Name: NEON_PROJECT_ID
Value: 你的Neon项目ID
```

## 🚀 **第三步：工作流功能说明**

### **neon_workflow.yml** - 数据库分支管理

这个工作流会：

- ✅ 为每个 PR 创建独立的数据库分支
- ✅ 自动运行数据库迁移
- ✅ 初始化默认数据（用户、分类等）
- ✅ 生成数据库架构对比
- ✅ 在 PR 关闭时自动删除分支

### **deploy-preview.yml** - 部署预览和质量检查

这个工作流会：

- ✅ 构建应用程序
- ✅ 运行代码质量检查
- ✅ 生成部署预览信息
- ✅ 提供测试清单

## 📊 **第四步：验证设置**

### 1. 创建测试 PR

1. 创建一个新分支：`git checkout -b test-workflow`
2. 做一个小改动并提交
3. 创建 Pull Request

### 2. 检查工作流执行

1. 进入 GitHub 仓库的 "Actions" 标签
2. 查看工作流是否成功运行
3. 检查 PR 中的自动评论

### 3. 验证 Neon 分支

1. 登录 Neon Console
2. 进入 "Branches" 页面
3. 确认看到新创建的预览分支

## 🔍 **工作流触发条件**

### **数据库分支工作流触发于：**

- PR 打开时
- PR 重新打开时
- PR 同步时（新提交）
- PR 关闭时（清理分支）

### **部署预览工作流触发于：**

- 修改源代码文件时
- 修改数据库架构时
- 修改配置文件时

## 🛠️ **自定义配置**

### 修改数据库分支命名

在 `neon_workflow.yml` 中修改：

```yaml
branch_name: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
```

### 添加额外的质量检查

在 `deploy-preview.yml` 中添加：

```yaml
- name: Run Security Audit
  run: npm audit --audit-level high
```

### 自定义 PR 评论

修改工作流中的 `script` 部分来自定义评论内容。

## 🚨 **故障排除**

### **常见问题**

1. **工作流失败：权限错误**

   - 检查 NEON_API_KEY 是否正确设置
   - 确认 API 密钥有足够的权限

2. **数据库连接失败**

   - 验证 NEON_PROJECT_ID 是否正确
   - 检查 Neon 项目是否处于活跃状态

3. **构建失败**
   - 检查依赖是否正确安装
   - 验证环境变量设置

### **调试步骤**

1. 查看 GitHub Actions 日志
2. 检查 Neon Console 中的分支状态
3. 验证 secrets 和 variables 设置
4. 测试 API 密钥权限

## 📈 **最佳实践**

### **安全性**

- ✅ 永远不要在日志中输出数据库 URL
- ✅ 使用 GitHub Secrets 存储敏感信息
- ✅ 定期轮换 API 密钥

### **性能**

- ✅ 使用并发控制避免重复工作流
- ✅ 缓存依赖以加快构建速度
- ✅ 只在必要时触发工作流

### **维护**

- ✅ 定期更新 Action 版本
- ✅ 监控工作流执行时间
- ✅ 清理不需要的分支

## 🎉 **设置完成！**

现在你的仓库已经配置了：

- 🗄️ **自动数据库分支管理**
- 🚀 **部署预览生成**
- 📊 **代码质量检查**
- 💬 **智能 PR 评论**

每次创建 PR 时，系统会自动：

1. 创建独立的数据库分支
2. 运行完整的测试套件
3. 生成部署预览
4. 提供详细的测试指南

这确保了每个功能都能在隔离的环境中安全测试！
