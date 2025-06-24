const fetch = require('node-fetch');

// 测试新增报告功能
async function testCreateReport() {
  console.log('🧪 开始测试新增报告功能...\n');

  const testReports = [
    {
      title: 'AI技术发展趋势分析',
      content: `
        <h1>AI技术发展趋势分析</h1>
        <p>本报告分析了2024年人工智能技术的主要发展趋势，包括大语言模型、多模态AI和AI安全等方面。</p>
        <h2>主要发现</h2>
        <ul>
          <li>大语言模型持续发展，参数规模不断增大</li>
          <li>多模态AI应用增加，图文理解能力提升</li>
          <li>AI安全性受到重视，对齐研究成为热点</li>
          <li>开源模型生态繁荣，降低了AI应用门槛</li>
        </ul>
        <h2>未来展望</h2>
        <p>预计未来AI技术将在以下方面取得突破：</p>
        <ol>
          <li>更强的推理能力</li>
          <li>更好的可解释性</li>
          <li>更低的计算成本</li>
        </ol>
      `,
      summary: '分析2024年AI技术发展趋势，包括大语言模型、多模态AI和AI安全等方面的最新进展。',
      status: 'published',
      priority: 'high',
      categoryId: 'tech-research',
      tags: ['AI', '技术趋势', '大语言模型', '多模态', 'AI安全']
    },
    {
      title: '区块链市场分析报告',
      content: `
        <div style="font-family: Arial, sans-serif;">
          <h1 style="color: #2563eb;">区块链市场分析报告</h1>
          <p style="line-height: 1.6;">本季度区块链市场表现出强劲的增长势头，DeFi和NFT领域尤为活跃。</p>
          
          <h2 style="color: #059669;">市场数据</h2>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr style="background-color: #f8fafc;">
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">指标</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">数值</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">变化</th>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">总市值</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">$2.1T</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; color: #059669;">+15%</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="border: 1px solid #e2e8f0; padding: 12px;">DeFi锁仓量</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">$180B</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; color: #059669;">+8%</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">NFT交易量</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">$12B</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; color: #dc2626;">-5%</td>
            </tr>
          </table>
          
          <h2 style="color: #7c3aed;">投资建议</h2>
          <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-weight: 500;">建议关注基础设施项目和实用性代币，避免过度投机。</p>
          </div>
        </div>
      `,
      summary: '本季度区块链市场分析，包括市场数据、DeFi和NFT表现，以及投资建议。',
      status: 'published',
      priority: 'medium',
      categoryId: 'market-analysis',
      tags: ['区块链', '市场分析', 'DeFi', 'NFT', '投资']
    },
    {
      title: '简单文本报告测试',
      content: `
        <title>简单文本报告测试</title>
        <h1>这是一个简单的测试报告</h1>
        <p>这个报告用于测试新增报告功能的基本功能。</p>
        <p>包含一些简单的文本内容，用于验证系统是否能正确处理。</p>
      `,
      status: 'draft',
      priority: 'low',
      categoryId: 'uncategorized',
      tags: ['测试', '简单文本']
    }
  ];

  for (let i = 0; i < testReports.length; i++) {
    const report = testReports[i];
    console.log(`📝 测试报告 ${i + 1}: ${report.title}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ 创建成功: ${result.report.id}`);
        console.log(`   标题: ${result.report.title}`);
        console.log(`   分类: ${result.report.categoryId || '未分类'}`);
        console.log(`   标签: ${result.report.tags?.map(t => t.name || t).join(', ') || '无'}`);
        console.log(`   状态: ${result.report.status}`);
        console.log(`   优先级: ${result.report.priority}`);
      } else {
        const error = await response.json();
        console.log(`❌ 创建失败: ${error.error}`);
        if (error.details) {
          console.log(`   详情: ${JSON.stringify(error.details, null, 2)}`);
        }
      }
    } catch (error) {
      console.log(`❌ 网络错误: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }

  // 测试获取报告列表
  console.log('📋 测试获取报告列表...');
  try {
    const response = await fetch('http://localhost:3000/api/reports');
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ 获取成功，共 ${result.reports.length} 个报告`);
      console.log(`   分页信息: 第${result.pagination.page}页，共${result.pagination.totalPages}页`);
    } else {
      console.log(`❌ 获取失败: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ 网络错误: ${error.message}`);
  }

  console.log('\n🎉 测试完成！');
}

// 运行测试
testCreateReport().catch(console.error); 