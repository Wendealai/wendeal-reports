// 修复分类创建事件触发
const fs = require('fs');
const path = require('path');

const fixCategoryEvent = () => {
  console.log('🔧 修复分类创建事件触发...\n');
  
  const sidebarPath = path.join(__dirname, 'src/components/sidebar/DashboardSidebar.tsx');
  
  try {
    // 读取文件内容
    let content = fs.readFileSync(sidebarPath, 'utf8');
    
    console.log('1️⃣ 添加分类创建事件触发...');
    
    // 在"console.log('✅ 新分类创建完成');"之前添加事件触发
    const oldCode = `                      console.log('✅ 新分类创建完成');`;
    const newCode = `                      // 触发分类创建事件，通知其他组件更新
                      window.dispatchEvent(new CustomEvent('categoryCreated', {
                        detail: { category: result.category }
                      }));
                      
                      console.log('✅ 新分类创建完成');`;
    
    content = content.replace(oldCode, newCode);
    
    console.log('2️⃣ 写入修复后的文件...');
    // 写入修复后的文件
    fs.writeFileSync(sidebarPath, content, 'utf8');
    
    console.log('✅ 分类创建事件触发修复完成！');
    console.log('\n📋 修复内容:');
    console.log('   - 在分类创建成功后触发categoryCreated事件');
    console.log('   - SimpleCategorySelector将监听此事件并刷新分类列表');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  }
};

fixCategoryEvent(); 