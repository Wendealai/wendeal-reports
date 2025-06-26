import { prisma } from './prisma';
import { createLogger } from './logger';

const logger = createLogger('DatabaseInit');

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k';

/**
 * 初始化默认用户
 */
async function initializeDefaultUser() {
  try {
    logger.info('检查默认用户是否存在...');
    
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    });
    
    if (existingUser) {
      logger.info(`默认用户已存在: ${existingUser.username}`);
      return existingUser;
    }
    
    // 创建默认用户
    logger.info('创建默认用户...');
    const newUser = await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        email: 'default@wendeal.com',
        username: 'default_user',
        password: 'default_password_hash', // 在生产环境中应该使用适当的密码哈希
      }
    });
    
    logger.info(`默认用户创建成功: ${newUser.username}`);
    return newUser;
    
  } catch (error) {
    logger.error('创建默认用户失败:', error);
    throw error;
  }
}

/**
 * 初始化预定义分类
 */
async function initializePredefinedCategories() {
  try {
    logger.info('初始化预定义分类...');
    
    const predefinedCategories = [
      {
        id: 'predefined-uncategorized',
        name: '未分类',
        icon: '📁',
        color: '#6B7280',
        userId: DEFAULT_USER_ID,
      },
      {
        id: 'predefined-tech-research',
        name: '技术研究',
        icon: '💻',
        color: '#3B82F6',
        userId: DEFAULT_USER_ID,
      },
      {
        id: 'predefined-market-analysis',
        name: '市场分析',
        icon: '📈',
        color: '#10B981',
        userId: DEFAULT_USER_ID,
      },
      {
        id: 'predefined-product-review',
        name: '产品评测',
        icon: '🔍',
        color: '#F59E0B',
        userId: DEFAULT_USER_ID,
      },
      {
        id: 'predefined-industry-insights',
        name: '行业洞察',
        icon: '🔬',
        color: '#8B5CF6',
        userId: DEFAULT_USER_ID,
      },
    ];

    const results = [];
    
    for (const categoryData of predefinedCategories) {
      try {
        // 检查是否已存在
        const existing = await prisma.category.findUnique({
          where: { id: categoryData.id }
        });
        
        if (existing) {
          logger.info(`分类已存在: ${categoryData.id} - ${existing.name}`);
          results.push({ action: 'exists', category: existing });
        } else {
          // 创建新分类
          const category = await prisma.category.create({
            data: categoryData
          });
          logger.info(`分类创建成功: ${category.id} - ${category.name}`);
          results.push({ action: 'created', category });
        }
      } catch (error) {
        logger.error(`创建分类失败 ${categoryData.id}:`, error);
        results.push({ 
          action: 'error', 
          categoryId: categoryData.id, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    logger.info('预定义分类初始化完成');
    return results;
    
  } catch (error) {
    logger.error('初始化预定义分类失败:', error);
    throw error;
  }
}

/**
 * 验证数据库初始化状态
 */
async function validateDatabaseInit() {
  try {
    logger.info('验证数据库初始化状态...');
    
    // 检查用户
    const user = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    });
    
    if (!user) {
      throw new Error('默认用户未找到');
    }
    
    // 检查关键分类
    const uncategorized = await prisma.category.findUnique({
      where: { id: 'predefined-uncategorized' }
    });
    
    if (!uncategorized) {
      throw new Error('未分类分类未找到');
    }
    
    // 检查所有预定义分类
    const categories = await prisma.category.findMany({
      where: { userId: DEFAULT_USER_ID }
    });
    
    logger.info(`验证完成 - 用户: ${user.username}, 分类数量: ${categories.length}`);
    
    return {
      user,
      categories,
      isValid: true
    };
    
  } catch (error) {
    logger.error('数据库验证失败:', error);
    return {
      user: null,
      categories: [],
      isValid: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 完整的数据库初始化流程
 */
export async function initializeDatabase() {
  try {
    logger.info('开始数据库初始化流程...');
    
    // 测试数据库连接
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('数据库连接正常');
    } catch (error) {
      logger.error('数据库连接失败:', error);
      throw new Error('数据库连接失败');
    }
    
    // 1. 初始化默认用户
    await initializeDefaultUser();
    
    // 2. 初始化预定义分类
    const categoryResults = await initializePredefinedCategories();
    
    // 3. 验证初始化结果
    const validation = await validateDatabaseInit();
    
    if (!validation.isValid) {
      throw new Error(`数据库验证失败: ${validation.error}`);
    }
    
    logger.info('数据库初始化完成！');
    
    return {
      success: true,
      user: validation.user,
      categories: validation.categories,
      categoryResults
    };
    
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 检查数据库是否需要初始化
 */
export async function checkDatabaseInitialization() {
  try {
    const validation = await validateDatabaseInit();
    return validation.isValid;
  } catch (error) {
    logger.error('检查数据库初始化状态失败:', error);
    return false;
  }
}

/**
 * 获取预定义分类ID映射
 */
export const PREDEFINED_CATEGORY_ID_MAP: Record<string, string> = {
  uncategorized: 'predefined-uncategorized',
  'tech-research': 'predefined-tech-research',
  'market-analysis': 'predefined-market-analysis',
  'product-review': 'predefined-product-review',
  'industry-insights': 'predefined-industry-insights',
};

export { DEFAULT_USER_ID };
