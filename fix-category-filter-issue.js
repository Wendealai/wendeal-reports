/**
 * 修复DashboardSidebar中的关键filter问题
 * 问题：第544行的 .filter(cat => cat.label) 会把没有label的分类过滤掉
 * 解决：移除filter并为空的分类名称提供默认值
 */

const fs = require('fs');
const path = require('path');

const sidebarFilePath = path.join(__dirname, 'src/components/sidebar/DashboardSidebar.tsx');

console.log('🔧 开始修复DashboardSidebar中的filter问题...');

try {
  let content = fs.readFileSync(sidebarFilePath, 'utf8');
  
  // 查找并替换问题代码
  const oldCode = `      // 🚀 修复：预定义分类，优先使用localStorage中的实际名称
      const allPredefinedCategories = [
        { id: 'uncategorized', label: currentNames['uncategorized'], icon: Folder, order: orderMap['uncategorized'] || 0 },
        { id: 'tech-research', label: currentNames['tech-research'], icon: File, order: orderMap['tech-research'] || 1 },
        { id: 'market-analysis', label: currentNames['market-analysis'], icon: File, order: orderMap['market-analysis'] || 2 },
        { id: 'product-review', label: currentNames['product-review'], icon: File, order: orderMap['product-review'] || 3 },
        { id: 'industry-insights', label: currentNames['industry-insights'], icon: File, order: orderMap['industry-insights'] || 4 },
      ].filter(cat => cat.label); // 🔧 只显示有名称的分类`;
  
  const newCode = `      // 🚀 关键修复：为空的分类名称提供默认值，避免filter误删
      const defaultCategoryNames = {
        'uncategorized': '📁 未分类',
        'tech-research': '💻 技术研究',
        'market-analysis': '📈 市场分析',
        'product-review': '🔍 产品评测',
        'industry-insights': '🔬 行业洞察'
      };
      
      console.log('🛡️ 使用安全的分类名称映射:', {
        localStorage: currentNames,
        默认值: defaultCategoryNames,
        最终结果: Object.keys(defaultCategoryNames).map(key => ({
          key,
          value: currentNames[key] || defaultCategoryNames[key]
        }))
      });
      
      const allPredefinedCategories = [
        { id: 'uncategorized', label: currentNames['uncategorized'] || defaultCategoryNames['uncategorized'], icon: Folder, order: orderMap['uncategorized'] || 0 },
        { id: 'tech-research', label: currentNames['tech-research'] || defaultCategoryNames['tech-research'], icon: File, order: orderMap['tech-research'] || 1 },
        { id: 'market-analysis', label: currentNames['market-analysis'] || defaultCategoryNames['market-analysis'], icon: File, order: orderMap['market-analysis'] || 2 },
        { id: 'product-review', label: currentNames['product-review'] || defaultCategoryNames['product-review'], icon: File, order: orderMap['product-review'] || 3 },
        { id: 'industry-insights', label: currentNames['industry-insights'] || defaultCategoryNames['industry-insights'], icon: File, order: orderMap['industry-insights'] || 4 },
      ]; // 🔧 移除filter，确保所有分类都显示`;
  
  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(sidebarFilePath, content, 'utf8');
    console.log('✅ DashboardSidebar.tsx 修复完成！');
    console.log('🎯 关键修复：');
    console.log('   - 移除了有问题的 .filter(cat => cat.label)');
    console.log('   - 为每个分类提供默认名称，确保即使localStorage为空也能显示');
    console.log('   - 保持用户自定义名称的优先级');
  } else {
    console.log('⚠️ 未找到目标代码，可能已经修复过或代码结构已改变');
  }
  
} catch (error) {
  console.error('❌ 修复过程中出现错误:', error);
} 