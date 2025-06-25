// 测试分类选择器修复
const testCategorySelector = async () => {
  console.log("🧪 测试分类选择器修复...\n");

  try {
    // 测试API端点
    const response = await fetch("http://localhost:3000/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "测试分类选择器",
        content:
          "<h1>测试分类选择器</h1><p>这是一个测试报告，用于验证分类选择器是否正常工作。</p>",
        description: "测试分类选择器功能",
        category: "tech-research", // 测试分类选择
        priority: "medium",
        tags: ["测试", "分类选择器"],
        fileSize: 1024,
        wordCount: 50,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ 分类选择器测试成功！");
      console.log("📊 创建的报告信息：");
      console.log(`   - ID: ${result.id}`);
      console.log(`   - 标题: ${result.title}`);
      console.log(`   - 分类: ${result.category}`);
      console.log(`   - 优先级: ${result.priority}`);
      console.log(`   - 标签: ${result.tags.join(", ")}`);
      console.log(`   - 创建时间: ${result.createdAt}`);
    } else {
      const error = await response.text();
      console.error("❌ 分类选择器测试失败：", error);
    }
  } catch (error) {
    console.error("❌ 测试过程中发生错误：", error.message);
  }
};

// 运行测试
testCategorySelector();
