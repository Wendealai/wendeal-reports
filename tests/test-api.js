// 测试API是否正常工作
async function testAPI() {
  try {
    console.log('🧪 开始测试API...');
    
    // 测试获取分类
    const categoriesResponse = await fetch('http://localhost:3000/api/categories');
    const categoriesData = await categoriesResponse.json();
    console.log('✅ 分类API正常:', categoriesData.categories?.length || 0, '个分类');

    // 测试获取报告
    const reportsResponse = await fetch('http://localhost:3000/api/reports');
    const reportsData = await reportsResponse.json();
    console.log('✅ 报告API正常:', reportsData.reports?.length || 0, '个报告');

    // 测试创建报告
    const newReportData = {
      title: '测试报告',
      content: '<h1>测试内容</h1><p>这是一个测试报告内容。</p>',
      summary: '测试摘要',
      status: 'published',
      priority: 'medium',
      categoryId: 'uncategorized',
      tags: ['测试']
    };

    const createResponse = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newReportData)
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ 创建报告成功:', createData.report?.title);
      
      // 测试再次获取报告
      const updatedReportsResponse = await fetch('http://localhost:3000/api/reports');
      const updatedReportsData = await updatedReportsResponse.json();
      console.log('✅ 更新后报告数量:', updatedReportsData.reports?.length || 0);
      
    } else {
      const errorData = await createResponse.json();
      console.error('❌ 创建报告失败:', createResponse.status, errorData);
    }

  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

testAPI(); 