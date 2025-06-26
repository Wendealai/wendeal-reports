// 生产环境分类数据清理脚本
// 用于部署到服务器后执行

console.log('🔧 生产环境分类数据清理脚本');
console.log('='.repeat(50));

// 分类清理API调用
async function cleanupCategories() {
  try {
    console.log('📞 调用分类清理API...');
    
    const response = await fetch('/api/admin/cleanup-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cleanup-duplicates',
        dryRun: false
      })
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ 分类清理完成:', result);
    
    return result;
  } catch (error) {
    console.error('❌ 分类清理失败:', error);
    throw error;
  }
}

// 状态更新测试
async function testStatusUpdate() {
  try {
    console.log('\n📝 测试状态更新功能...');
    
    // 获取第一个报告
    const reportsResponse = await fetch('/api/reports?limit=1');
    if (!reportsResponse.ok) {
      throw new Error('获取报告失败');
    }
    
    const reportsData = await reportsResponse.json();
    if (!reportsData.reports || reportsData.reports.length === 0) {
      console.log('⚠️ 没有报告可供测试');
      return;
    }
    
    const testReport = reportsData.reports[0];
    console.log(`🔍 使用报告进行测试: ${testReport.title} (${testReport.id})`);
    console.log(`   当前状态: ${testReport.status}`);
    
    // 测试状态更新
    const newStatus = testReport.status === 'completed' ? 'reading' : 'completed';
    console.log(`   测试更新状态到: ${newStatus}`);
    
    const updateResponse = await fetch(`/api/reports/${testReport.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        readStatus: newStatus
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`状态更新失败: ${updateResponse.status} - ${errorText}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('✅ 状态更新成功:', {
      reportId: updateResult.report.id,
      oldStatus: testReport.status,
      newStatus: updateResult.report.status
    });
    
    // 恢复原状态
    console.log('🔄 恢复原状态...');
    const restoreResponse = await fetch(`/api/reports/${testReport.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        readStatus: testReport.status
      })
    });
    
    if (restoreResponse.ok) {
      console.log('✅ 原状态恢复成功');
    } else {
      console.log('⚠️ 原状态恢复失败，但测试已完成');
    }
    
  } catch (error) {
    console.error('❌ 状态更新测试失败:', error);
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始生产环境数据清理和测试...\n');
    
    // 1. 清理重复分类
    await cleanupCategories();
    
    // 2. 测试状态更新功能
    await testStatusUpdate();
    
    console.log('\n🎉 生产环境清理和测试完成!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ 生产环境操作失败:', error);
    process.exit(1);
  }
}

// 如果直接运行脚本
if (typeof window === 'undefined') {
  // Node.js 环境，需要配置fetch
  if (typeof fetch === 'undefined') {
    console.log('⚠️ 此脚本需要在浏览器环境中运行');
    console.log('   请在部署的网站控制台中执行此脚本');
    console.log('   或使用: node --experimental-fetch production-category-cleanup.js');
  } else {
    main();
  }
} else {
  // 浏览器环境，可以直接运行
  main();
}

// 导出函数供外部调用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cleanupCategories, testStatusUpdate, main };
}
