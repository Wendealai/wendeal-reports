const fs = require("fs");

// 修复DashboardSidebar.tsx中的演示模式检查
const sidebarPath = "src/components/sidebar/DashboardSidebar.tsx";
let sidebarContent = fs.readFileSync(sidebarPath, "utf8");

// 移除演示模式检查
sidebarContent = sidebarContent.replace(
  "  // 单独的useEffect来检查演示模式\n  useEffect(() => {\n    const token = localStorage.getItem('auth_token');\n    setIsDemoMode(token?.startsWith('demo_token_') || false);\n  }, []);",
  "  // 演示模式已禁用（单用户系统）\n  useEffect(() => {\n    setIsDemoMode(false);\n  }, []);",
);

fs.writeFileSync(sidebarPath, sidebarContent, "utf8");
console.log("✅ DashboardSidebar.tsx 已修复");

// 修复UserManagement组件
const userMgmtPath = "src/components/sidebar/UserManagement.tsx";
if (fs.existsSync(userMgmtPath)) {
  let userMgmtContent = fs.readFileSync(userMgmtPath, "utf8");

  // 替换token检查
  userMgmtContent = userMgmtContent.replace(
    /const token = localStorage\.getItem\('auth_token'\);/g,
    "const token = null; // 单用户系统无需token",
  );

  fs.writeFileSync(userMgmtPath, userMgmtContent, "utf8");
  console.log("✅ UserManagement.tsx 已修复");
}

console.log("🎉 所有认证相关代码已修复");
