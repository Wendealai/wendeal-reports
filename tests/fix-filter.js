const fs = require("fs");

console.log("🔧 修复DashboardSidebar中的filter问题...");

const file = "src/components/sidebar/DashboardSidebar.tsx";
let content = fs.readFileSync(file, "utf8");

// 替换有问题的filter
const oldLine = "].filter(cat => cat.label); // 🔧 只显示有名称的分类";
const newLine = "]; // 🔧 移除filter，确保所有分类都显示（问题修复）";

if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync(file, content);
  console.log("✅ 修复完成！移除了有问题的filter");
} else {
  console.log("⚠️ 未找到目标代码");
}

// 同时修复分类名称，提供默认值
const oldCode = `        { id: 'uncategorized', label: currentNames['uncategorized'], icon: Folder, order: orderMap['uncategorized'] || 0 },`;
const newCode = `        { id: 'uncategorized', label: currentNames['uncategorized'] || '📁 未分类', icon: Folder, order: orderMap['uncategorized'] || 0 },`;

content = fs.readFileSync(file, "utf8");
if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  content = content.replace(
    `        { id: 'tech-research', label: currentNames['tech-research'], icon: File, order: orderMap['tech-research'] || 1 },`,
    `        { id: 'tech-research', label: currentNames['tech-research'] || '💻 技术研究', icon: File, order: orderMap['tech-research'] || 1 },`,
  );
  content = content.replace(
    `        { id: 'market-analysis', label: currentNames['market-analysis'], icon: File, order: orderMap['market-analysis'] || 2 },`,
    `        { id: 'market-analysis', label: currentNames['market-analysis'] || '📈 市场分析', icon: File, order: orderMap['market-analysis'] || 2 },`,
  );
  content = content.replace(
    `        { id: 'product-review', label: currentNames['product-review'], icon: File, order: orderMap['product-review'] || 3 },`,
    `        { id: 'product-review', label: currentNames['product-review'] || '🔍 产品评测', icon: File, order: orderMap['product-review'] || 3 },`,
  );
  content = content.replace(
    `        { id: 'industry-insights', label: currentNames['industry-insights'], icon: File, order: orderMap['industry-insights'] || 4 },`,
    `        { id: 'industry-insights', label: currentNames['industry-insights'] || '🔬 行业洞察', icon: File, order: orderMap['industry-insights'] || 4 },`,
  );

  fs.writeFileSync(file, content);
  console.log("✅ 为所有分类提供了默认值");
} else {
  console.log("⚠️ 分类已有默认值或代码已更改");
}
