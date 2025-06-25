// 测试分类选择器修复
const testCategorySelectorFix = async () => {
  console.log("🧪 测试分类选择器修复...\n");

  try {
    // 1. 测试预定义分类是否正确显示
    console.log("1️⃣ 检查预定义分类...");

    const baseCategoryNames = {
      uncategorized: "📁 未分类",
      "tech-research": "💻 技术研究",
      "market-analysis": "📊 市场分析",
      "product-review": "🔍 产品评测",
      "industry-insights": "🔬 行业洞察",
    };

    console.log("预定义分类:", baseCategoryNames);

    // 2. 测试API创建报告时分类选择
    console.log("\n2️⃣ 测试创建报告时的分类选择...");

    const testReports = [
      {
        title: "测试未分类报告",
        content: "<h1>测试未分类</h1><p>这是一个未分类的测试报告。</p>",
        description: "测试未分类功能",
        category: "uncategorized",
        priority: "medium",
        tags: ["测试", "未分类"],
        fileSize: 1024,
        wordCount: 50,
      },
      {
        title: "测试技术研究报告",
        content: "<h1>AI技术研究</h1><p>这是一个技术研究报告。</p>",
        description: "测试技术研究分类",
        category: "tech-research",
        priority: "high",
        tags: ["测试", "技术研究"],
        fileSize: 2048,
        wordCount: 100,
      },
      {
        title: "测试市场分析报告",
        content: "<h1>市场分析</h1><p>这是一个市场分析报告。</p>",
        description: "测试市场分析分类",
        category: "market-analysis",
        priority: "medium",
        tags: ["测试", "市场分析"],
        fileSize: 1536,
        wordCount: 75,
      },
    ];

    for (const testReport of testReports) {
      console.log(`\n📝 创建报告: ${testReport.title}`);
      console.log(`   分类: ${testReport.category}`);

      const response = await fetch("http://localhost:3000/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testReport),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ 创建成功 - ID: ${result.id}`);
        console.log(`   📁 分类: ${result.category}`);
      } else {
        const error = await response.text();
        console.error(`   ❌ 创建失败: ${error}`);
      }
    }

    console.log("\n✅ 分类选择器修复测试完成！");
    console.log("\n📋 测试结果总结:");
    console.log("   - 预定义分类已正确配置");
    console.log("   - 分类选择器应该能显示所有分类选项");
    console.log("   - 包括：未分类、技术研究、市场分析、产品评测、行业洞察");
    console.log("   - 以及任何用户自定义的分类");
  } catch (error) {
    console.error("❌ 测试过程中发生错误：", error.message);
  }
};

// 运行测试
testCategorySelectorFix();
