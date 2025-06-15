const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initSingleUserData() {
  try {
    console.log('🚀 开始初始化单用户系统数据...')

    // 查找现有的admin用户
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { username: 'admin' },
          { email: 'admin@wendeal.com' }
        ]
      }
    })

    if (!user) {
      // 如果没有admin用户，创建一个
      user = await prisma.user.create({
        data: {
          email: 'admin@wendeal.com',
          username: 'admin',
          password: 'hashed-password-placeholder',
        }
      })
      console.log('✅ 创建默认用户:', user.email)
    } else {
      console.log('✅ 找到现有管理员用户:', user.email, 'ID:', user.id)
    }

    const DEFAULT_USER_ID = user.id

    // 检查是否已有分类
    const existingCategories = await prisma.category.findMany({
      where: { userId: DEFAULT_USER_ID }
    })

    if (existingCategories.length === 0) {
      // 创建预定义分类
      const categories = await Promise.all([
        prisma.category.create({
          data: {
            id: 'tech-research',
            name: '技术研究',
            description: '技术相关的研究报告',
            color: '#3B82F6',
            icon: '💻',
            userId: DEFAULT_USER_ID,
          }
        }),
        prisma.category.create({
          data: {
            id: 'market-analysis',
            name: '市场分析',
            description: '市场趋势和分析报告',
            color: '#10B981',
            icon: '📈',
            userId: DEFAULT_USER_ID,
          }
        }),
        prisma.category.create({
          data: {
            id: 'product-review',
            name: '产品评测',
            description: '产品评测和比较报告',
            color: '#F59E0B',
            icon: '🔍',
            userId: DEFAULT_USER_ID,
          }
        }),
        prisma.category.create({
          data: {
            id: 'industry-insights',
            name: '行业洞察',
            description: '行业趋势和洞察报告',
            color: '#8B5CF6',
            icon: '🔬',
            userId: DEFAULT_USER_ID,
          }
        }),
        prisma.category.create({
          data: {
            id: 'uncategorized',
            name: '未分类',
            description: '暂未分类的报告',
            color: '#6B7280',
            icon: '📁',
            userId: DEFAULT_USER_ID,
          }
        })
      ])

      console.log(`✅ 创建了 ${categories.length} 个预定义分类`)
    } else {
      console.log(`ℹ️  已存在 ${existingCategories.length} 个分类`)
    }

    // 创建示例报告（如果没有的话）
    const existingReports = await prisma.report.findMany({
      where: { userId: DEFAULT_USER_ID }
    })

    if (existingReports.length === 0) {
      const sampleReport = await prisma.report.create({
        data: {
          title: '欢迎使用 Wendeal Reports',
          content: `# 欢迎使用 Wendeal Reports

这是一个简化的单用户报告管理系统。你可以：

1. 📁 在左侧边栏创建和管理分类
2. 📄 上传和管理文档报告
3. 🔍 搜索和浏览报告内容
4. 🏷️ 为报告添加标签
5. ⚙️ 自定义系统设置

现在你可以开始上传你的第一个报告了！`,
          summary: '系统欢迎指南和功能介绍',
          status: 'published',
          categoryId: 'uncategorized',
          userId: DEFAULT_USER_ID,
          publishedAt: new Date(),
        }
      })

      console.log('✅ 创建示例报告:', sampleReport.title)
    } else {
      console.log(`ℹ️  已存在 ${existingReports.length} 个报告`)
    }

    console.log('🎉 单用户系统数据初始化完成！')
    console.log(`👤 系统将使用用户ID: ${DEFAULT_USER_ID}`)

  } catch (error) {
    console.error('❌ 初始化失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行初始化
initSingleUserData()
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  }) 