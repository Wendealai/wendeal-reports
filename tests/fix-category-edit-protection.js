const fs = require('fs');
const path = require('path');

console.log('🛡️ 添加分类编辑保护机制...');

const filePath = path.join(__dirname, 'src/components/sidebar/DashboardSidebar.tsx');

try {
  // 读取文件内容
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. 在updateCategories函数中添加编辑状态检查
  const updateCategoriesPattern = /const updateCategories = \(\) => \{/;
  const updateCategoriesReplacement = `const updateCategories = () => {
      // 🛡️ 如果正在编辑分类，暂停更新避免冲突
      if (editingId) {
        console.log('⏸️ 正在编辑分类，跳过自动更新:', editingId);
        return;
      }`;
  
  content = content.replace(updateCategoriesPattern, updateCategoriesReplacement);
  
  // 2. 在handleSaveEdit中添加加载状态保护
  const handleSaveEditPattern = /console\.log\('🔄 延迟重新加载分类列表，确保数据已保存'\);/;
  const handleSaveEditReplacement = `console.log('🔄 延迟重新加载分类列表，确保数据已保存');
        // 🛡️ 确保编辑状态已清除，避免冲突
        if (editingId) {
          console.log('⚠️ 编辑状态未清除，强制清除:', editingId);
          setEditingId(null);
          setEditValue('');
        }`;
  
  content = content.replace(handleSaveEditPattern, handleSaveEditReplacement);
  
  // 写入修改后的内容
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ 成功添加分类编辑保护机制');
  console.log('📝 保护措施：');
  console.log('  - 编辑期间暂停自动更新');
  console.log('  - 确保编辑状态正确清除');
  
} catch (error) {
  console.error('❌ 添加保护机制时出错:', error);
} 