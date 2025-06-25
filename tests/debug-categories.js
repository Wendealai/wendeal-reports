// 在浏览器控制台中运行此脚本来调试分类数据
console.log("🔍 检查分类数据...");

// 检查localStorage中的数据
const predefinedNames = localStorage.getItem("predefined_category_names");
console.log(
  "📁 预定义分类名称:",
  predefinedNames ? JSON.parse(predefinedNames) : "未找到",
);

// 检查Zustand store（如果可用）
if (window.__ZUSTAND_STORE__) {
  const state = window.__ZUSTAND_STORE__.getState();
  console.log("🏪 Store状态:", {
    categories: state.categories,
    predefinedCategoryNames: state.predefinedCategoryNames,
  });
} else {
  console.log("⚠️ Zustand store不可用");
}

// 检查API端点
fetch("/api/categories")
  .then((response) => response.json())
  .then((data) => {
    console.log("🌐 API分类数据:", data);
  })
  .catch((error) => {
    console.error("❌ API调用失败:", error);
  });
