const fs = require("fs");
const path = require("path");

console.log("🔧 最终修复分类编辑功能...");

const filePath = path.join(
  __dirname,
  "src/components/sidebar/DashboardSidebar.tsx",
);

try {
  // 读取文件内容
  let content = fs.readFileSync(filePath, "utf8");

  // 1. 修复updateCategories函数的编辑保护
  const updateCategoriesPattern =
    /const updateCategories = \(\) => \{\s*\/\/ 🛡️[^}]+?console\.log\('🔄 更新分类列表\.\.\.'\);/s;
  const updateCategoriesReplacement = `const updateCategories = () => {
      // 🛡️ 如果正在编辑分类，暂停更新避免冲突
      if (editingId) {
        console.log('⏸️ 正在编辑分类，跳过自动更新:', editingId);
        return;
      }
      console.log('🔄 更新分类列表...');`;

  content = content.replace(
    updateCategoriesPattern,
    updateCategoriesReplacement,
  );

  // 2. 修复handleSaveEdit的时序问题
  const handleSaveEditPattern =
    /const handleSaveEdit = \(categoryId: string\) => \{[\s\S]*?\};/;
  const handleSaveEditReplacement = `const handleSaveEdit = (categoryId: string) => {
    setEditingId(null);
    setEditValue('');
    
    console.log('💾 分类编辑完成，等待数据保存:', categoryId);
    
    // 🚀 修复：等待CategoryCard保存数据，然后再重新加载
    setTimeout(() => {
      console.log('🔄 延迟重新加载分类列表，确保数据已保存');
      window.dispatchEvent(new CustomEvent('categoryOrderChanged'));
    }, 300); // 增加延迟到300ms，确保CategoryCard有足够时间保存
  };`;

  content = content.replace(handleSaveEditPattern, handleSaveEditReplacement);

  // 写入修改后的内容
  fs.writeFileSync(filePath, content, "utf8");
  console.log("✅ 成功修复分类编辑功能");
  console.log("📝 修复内容：");
  console.log("  - 编辑期间暂停自动更新");
  console.log("  - 延迟300ms确保数据保存完成");
} catch (error) {
  console.error("❌ 修复过程中出错:", error);
}
