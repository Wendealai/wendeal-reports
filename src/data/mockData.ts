import { Report, Category } from '@/types';

// 示例分类数据
export const mockCategories: Category[] = [
  {
    id: 'tech',
    name: '技术研究',
    reportCount: 8,
    icon: 'Code',
    description: '技术相关的深度研究报告',
    children: [
      {
        id: 'ai-ml',
        name: 'AI/机器学习',
        parentId: 'tech',
        reportCount: 3,
        icon: 'Brain',
      },
      {
        id: 'web-dev',
        name: 'Web开发',
        parentId: 'tech',
        reportCount: 5,
        icon: 'Globe',
      }
    ]
  },
  {
    id: 'business',
    name: '商业分析',
    reportCount: 6,
    icon: 'TrendingUp',
    description: '商业模式和市场分析报告',
  },
  {
    id: 'research',
    name: '学术研究',
    reportCount: 4,
    icon: 'BookOpen',
    description: '学术和理论研究报告',
  },
  {
    id: 'market',
    name: '市场调研',
    reportCount: 5,
    icon: 'BarChart3',
    description: '市场趋势和竞品分析',
  }
];

// 示例报告数据
export const mockReports: Report[] = [
  {
    id: '1',
    title: 'Next.js 14 应用架构深度分析',
    description: '深入分析Next.js 14的新特性、架构设计和最佳实践',
    category: 'web-dev',
    tags: ['Next.js', 'React', 'SSR', 'TypeScript'],
    filePath: '/reports/nextjs-14-analysis.html',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01'),
    isFavorite: true,
    readStatus: 'completed',
    fileSize: 2048,
    wordCount: 8500,
  },
  {
    id: '2',
    title: 'GPT-4与Claude对比研究报告',
    description: '详细对比分析GPT-4和Claude在不同场景下的表现差异',
    category: 'ai-ml',
    tags: ['GPT-4', 'Claude', 'LLM', '对比分析'],
    filePath: '/reports/gpt4-vs-claude.html',
    createdAt: new Date('2024-11-28'),
    updatedAt: new Date('2024-11-28'),
    isFavorite: false,
    readStatus: 'reading',
    fileSize: 3072,
    wordCount: 12000,
  },
  {
    id: '3',
    title: 'SaaS产品定价策略研究',
    description: '分析主流SaaS产品的定价模型和用户增长策略',
    category: 'business',
    tags: ['SaaS', '定价策略', '商业模式', '用户增长'],
    filePath: '/reports/saas-pricing-strategy.html',
    createdAt: new Date('2024-11-25'),
    updatedAt: new Date('2024-11-25'),
    isFavorite: true,
    readStatus: 'unread',
    fileSize: 1536,
    wordCount: 6800,
  },
  {
    id: '4',
    title: 'React Server Components深度解析',
    description: 'React Server Components的工作原理、优势和实际应用案例',
    category: 'web-dev',
    tags: ['React', 'RSC', '服务端渲染', '性能优化'],
    filePath: '/reports/react-server-components.html',
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2024-11-20'),
    isFavorite: false,
    readStatus: 'unread',
    fileSize: 2560,
    wordCount: 9200,
  },
  {
    id: '5',
    title: '2024年AI工具市场分析',
    description: '全面分析2024年AI工具市场的发展趋势和竞争格局',
    category: 'market',
    tags: ['AI工具', '市场分析', '2024', '趋势预测'],
    filePath: '/reports/ai-tools-market-2024.html',
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-11-15'),
    isFavorite: true,
    readStatus: 'completed',
    fileSize: 4096,
    wordCount: 15000,
  },
  {
    id: '6',
    title: 'TypeScript 5.0新特性研究',
    description: 'TypeScript 5.0的新特性详解和实际应用指南',
    category: 'web-dev',
    tags: ['TypeScript', '5.0', '新特性', '类型系统'],
    filePath: '/reports/typescript-5-features.html',
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-11-10'),
    isFavorite: false,
    readStatus: 'reading',
    fileSize: 1800,
    wordCount: 7500,
  }
];

// 工具函数：根据分类ID获取报告
export const getReportsByCategory = (categoryId: string): Report[] => {
  return mockReports.filter(report => report.category === categoryId);
};

// 工具函数：获取分类树结构
export const buildCategoryTree = (categories: Category[]): Category[] => {
  const tree: Category[] = [];
  const lookup: { [id: string]: Category } = {};

  // 创建查找表
  categories.forEach(cat => {
    lookup[cat.id] = { ...cat, children: [] };
  });

  // 构建树结构
  categories.forEach(cat => {
    if (cat.parentId && lookup[cat.parentId]) {
      lookup[cat.parentId].children!.push(lookup[cat.id]);
    } else {
      tree.push(lookup[cat.id]);
    }
  });

  return tree;
}; 