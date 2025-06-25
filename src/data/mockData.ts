import { Report, Category } from "@/types";

// 生成丰富的HTML报告内容
const generateHTMLReport = (title: string, content: string): string => {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 { color: #2563eb; }
        h1 { border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { margin-top: 30px; }
        .highlight { background-color: #fef3c7; padding: 2px 4px; border-radius: 3px; }
        .code-block {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        th, td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8fafc;
            font-weight: 600;
        }
        .info-box {
            background-color: #dbeafe;
            border-left: 4px solid #2563eb;
            padding: 16px;
            margin: 16px 0;
        }
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${content}
</body>
</html>`)}`;
};

export const mockCategories: Category[] = [
  {
    id: "tech-research",
    name: "技术研究",
    color: "#3b82f6",
    description: "技术趋势和深度分析报告",
    reportCount: 4,
  },
  {
    id: "market-analysis",
    name: "市场分析",
    color: "#10b981",
    description: "市场研究和商业分析",
    reportCount: 2,
  },
  {
    id: "product-review",
    name: "产品评测",
    color: "#f59e0b",
    description: "产品使用体验和评测报告",
    reportCount: 3,
  },
  {
    id: "industry-insights",
    name: "行业洞察",
    color: "#8b5cf6",
    description: "行业发展趋势和深度观察",
    reportCount: 2,
  },
];

export const mockReports: Report[] = [
  {
    id: "1",
    title: "Next.js 14 应用架构深度分析",
    description:
      "全面解析 Next.js 14 的核心特性、应用架构和最佳实践，包含 App Router、Server Components 等新特性的详细分析。",
    category: "tech-research",
    tags: ["Next.js", "React", "Web开发", "前端架构"],
    content: `
      <h2>核心特性概览</h2>
      <div class="info-box">
        <strong>Next.js 14</strong> 是 React 生态系统中最重要的全栈框架之一，本报告深入分析其核心特性和应用场景。
      </div>
      
      <h3>App Router 新特性</h3>
      <p>App Router 是 Next.js 13+ 的核心创新，它基于 React Server Components 构建，提供了更强大的布局系统和数据获取能力。</p>
      
      <div class="code-block">
        <strong>文件系统路由示例：</strong><br>
        app/<br>
        ├── layout.tsx      # 根布局<br>
        ├── page.tsx        # 首页<br>
        ├── about/page.tsx  # /about 路由<br>
        └── blog/<br>
        &nbsp;&nbsp;&nbsp;&nbsp;├── layout.tsx   # 博客布局<br>
        &nbsp;&nbsp;&nbsp;&nbsp;└── [slug]/page.tsx  # 动态路由
      </div>
      
      <h3>性能优化策略</h3>
      <table>
        <tr><th>优化技术</th><th>作用</th><th>使用场景</th></tr>
        <tr><td>Server Components</td><td>服务端渲染组件</td><td>静态内容、数据获取</td></tr>
        <tr><td>Streaming</td><td>分块传输</td><td>大型页面、复杂计算</td></tr>
        <tr><td>Partial Prerendering</td><td>部分预渲染</td><td>混合静态/动态内容</td></tr>
        <tr><td>Image Optimization</td><td>图片优化</td><td>所有图片资源</td></tr>
      </table>
      
      <h3>数据获取模式</h3>
      <div class="code-block">
        // Server Component 中的数据获取<br>
        async function BlogPage({ params }) {<br>
        &nbsp;&nbsp;const posts = await fetch('https://api.example.com/posts')<br>
        &nbsp;&nbsp;&nbsp;&nbsp;.then(res => res.json());<br>
        &nbsp;&nbsp;<br>
        &nbsp;&nbsp;return (<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;div&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{posts.map(post => &lt;Article key={post.id} {...post} /&gt;)}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;/div&gt;<br>
        &nbsp;&nbsp;);<br>
        }
      </div>
      
      <div class="warning-box">
        <strong>注意：</strong> Server Components 运行在服务端，无法使用浏览器 API 或事件处理器。需要交互功能时，使用 'use client' 指令创建 Client Components。
      </div>
      
      <h3>部署和性能监控</h3>
      <p>Next.js 14 提供了内置的性能监控和分析工具，结合 Vercel 平台可以实现最佳的部署体验。</p>
      
      <h3>结论</h3>
      <p class="highlight">Next.js 14 通过 App Router、Server Components 和 Streaming 等技术，为现代 Web 应用提供了强大的性能和开发体验。</p>
    `,
    filePath: generateHTMLReport(
      "Next.js 14 应用架构深度分析",
      `
      <h2>核心特性概览</h2>
      <div class="info-box">
        <strong>Next.js 14</strong> 是 React 生态系统中最重要的全栈框架之一，本报告深入分析其核心特性和应用场景。
      </div>
      
      <h3>App Router 新特性</h3>
      <p>App Router 是 Next.js 13+ 的核心创新，它基于 React Server Components 构建，提供了更强大的布局系统和数据获取能力。</p>
      
      <div class="code-block">
        <strong>文件系统路由示例：</strong><br>
        app/<br>
        ├── layout.tsx      # 根布局<br>
        ├── page.tsx        # 首页<br>
        ├── about/page.tsx  # /about 路由<br>
        └── blog/<br>
        &nbsp;&nbsp;&nbsp;&nbsp;├── layout.tsx   # 博客布局<br>
        &nbsp;&nbsp;&nbsp;&nbsp;└── [slug]/page.tsx  # 动态路由
      </div>
      
      <h3>性能优化策略</h3>
      <table>
        <tr><th>优化技术</th><th>作用</th><th>使用场景</th></tr>
        <tr><td>Server Components</td><td>服务端渲染组件</td><td>静态内容、数据获取</td></tr>
        <tr><td>Streaming</td><td>分块传输</td><td>大型页面、复杂计算</td></tr>
        <tr><td>Partial Prerendering</td><td>部分预渲染</td><td>混合静态/动态内容</td></tr>
        <tr><td>Image Optimization</td><td>图片优化</td><td>所有图片资源</td></tr>
      </table>
      
      <h3>数据获取模式</h3>
      <div class="code-block">
        // Server Component 中的数据获取<br>
        async function BlogPage({ params }) {<br>
        &nbsp;&nbsp;const posts = await fetch('https://api.example.com/posts')<br>
        &nbsp;&nbsp;&nbsp;&nbsp;.then(res => res.json());<br>
        &nbsp;&nbsp;<br>
        &nbsp;&nbsp;return (<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;div&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{posts.map(post => &lt;Article key={post.id} {...post} /&gt;)}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;/div&gt;<br>
        &nbsp;&nbsp;);<br>
        }
      </div>
      
      <div class="warning-box">
        <strong>注意：</strong> Server Components 运行在服务端，无法使用浏览器 API 或事件处理器。需要交互功能时，使用 'use client' 指令创建 Client Components。
      </div>
      
      <h3>部署和性能监控</h3>
      <p>Next.js 14 提供了内置的性能监控和分析工具，结合 Vercel 平台可以实现最佳的部署体验。</p>
      
      <h3>结论</h3>
      <p class="highlight">Next.js 14 通过 App Router、Server Components 和 Streaming 等技术，为现代 Web 应用提供了强大的性能和开发体验。</p>
    `,
    ),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    isFavorite: true,
    readStatus: "completed",
    fileSize: 125632,
    wordCount: 3240,
  },
  {
    id: "2",
    title: "GPT-4 与 Claude 对比研究报告",
    description:
      "深入对比分析 OpenAI GPT-4 和 Anthropic Claude 两大AI模型的能力、特点和应用场景，为AI技术选型提供参考。",
    category: "tech-research",
    tags: ["AI", "GPT-4", "Claude", "机器学习", "对比分析"],
    content: `
      <h2>模型概述</h2>
      <p>本报告对比分析了当前最先进的两个大语言模型：OpenAI 的 GPT-4 和 Anthropic 的 Claude。</p>
      
      <h3>核心能力对比</h3>
      <table>
        <tr><th>能力维度</th><th>GPT-4</th><th>Claude</th><th>说明</th></tr>
        <tr><td>文本生成</td><td>优秀</td><td>优秀</td><td>两者都有很强的文本生成能力</td></tr>
        <tr><td>代码编程</td><td>优秀</td><td>良好</td><td>GPT-4 在代码生成方面略胜一筹</td></tr>
        <tr><td>数学推理</td><td>良好</td><td>优秀</td><td>Claude 在复杂数学问题上表现更好</td></tr>
        <tr><td>创意写作</td><td>优秀</td><td>优秀</td><td>两者都有很强的创意能力</td></tr>
        <tr><td>安全性</td><td>良好</td><td>优秀</td><td>Claude 在安全性方面有明显优势</td></tr>
      </table>
    `,
    filePath: generateHTMLReport(
      "GPT-4 与 Claude 对比研究报告",
      `
      <h2>模型概述</h2>
      <div class="info-box">
        本报告对比分析了当前最先进的两个大语言模型：<strong>OpenAI 的 GPT-4</strong> 和 <strong>Anthropic 的 Claude</strong>。两个模型都代表了当前AI技术的最高水平，但各有特色和优势。
      </div>
      
      <h3>核心能力对比</h3>
      <table>
        <tr><th>能力维度</th><th>GPT-4</th><th>Claude</th><th>详细说明</th></tr>
        <tr><td>文本生成</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>两者都有出色的文本生成能力，流畅自然</td></tr>
        <tr><td>代码编程</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐</td><td>GPT-4 在代码生成和调试方面略胜一筹</td></tr>
        <tr><td>数学推理</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>Claude 在复杂数学问题求解上表现更优</td></tr>
        <tr><td>创意写作</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>两者都具备强大的创意写作能力</td></tr>
        <tr><td>安全性</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>Claude 在内容安全和伦理方面更严格</td></tr>
        <tr><td>上下文理解</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐</td><td>GPT-4 支持更长的上下文窗口</td></tr>
      </table>
      
      <h3>技术架构差异</h3>
      <div class="code-block">
        <strong>GPT-4 特点：</strong><br>
        • 基于 Transformer 架构<br>
        • 多模态能力（文本+图像）<br>
        • 强大的零样本学习能力<br>
        • 支持代码解释器和插件系统
      </div>
      
      <div class="code-block">
        <strong>Claude 特点：</strong><br>
        • Constitutional AI 训练方法<br>
        • 更强的安全性和可控性<br>
        • 优秀的长文档处理能力<br>
        • 注重AI安全和对齐
      </div>
      
      <h3>应用场景推荐</h3>
      <div class="info-box">
        <strong>选择 GPT-4 的场景：</strong><br>
        • 需要多模态处理（文本+图像）<br>
        • 代码开发和调试任务<br>
        • 需要插件和工具集成<br>
        • 创意内容生成
      </div>
      
      <div class="warning-box">
        <strong>选择 Claude 的场景：</strong><br>
        • 对安全性要求较高的应用<br>
        • 需要处理长文档的任务<br>
        • 数学和逻辑推理密集型工作<br>
        • 学术研究和分析
      </div>
      
      <h3>性能基准测试</h3>
      <p>基于多个标准化测试集的评估结果：</p>
      <table>
        <tr><th>测试项目</th><th>GPT-4 得分</th><th>Claude 得分</th></tr>
        <tr><td>MMLU (通用知识)</td><td>86.4%</td><td>85.2%</td></tr>
        <tr><td>HumanEval (代码)</td><td>67.0%</td><td>60.8%</td></tr>
        <tr><td>GSM8K (数学)</td><td>92.0%</td><td>94.1%</td></tr>
        <tr><td>HellaSwag (常识)</td><td>95.3%</td><td>94.7%</td></tr>
      </table>
      
      <h3>成本和可用性分析</h3>
      <p>两个模型在定价和API可用性方面各有特点，需要根据具体需求和预算来选择。</p>
      
      <h3>未来发展趋势</h3>
      <p class="highlight">AI大模型正朝着更高效、更安全、更通用的方向发展。GPT-4和Claude都在不断改进，未来可能会看到更多创新功能。</p>
    `,
    ),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    isFavorite: false,
    readStatus: "reading",
    fileSize: 89456,
    wordCount: 2830,
  },
  {
    id: "3",
    title: "Web 应用性能优化指南",
    description:
      "全面的Web应用性能优化策略，涵盖前端优化、网络优化、缓存策略等多个维度的最佳实践。",
    category: "tech-research",
    tags: ["性能优化", "Web开发", "前端", "缓存", "CDN"],
    content: "详细的性能优化策略和实施方案...",
    filePath: "/reports/web-performance-guide.html",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-15"),
    isFavorite: true,
    readStatus: "unread",
    fileSize: 156780,
    wordCount: 4120,
  },
  {
    id: "4",
    title: "区块链技术发展现状分析",
    description:
      "深入分析当前区块链技术的发展现状、主要挑战和未来趋势，包括DeFi、NFT、Layer2等热点领域。",
    category: "tech-research",
    tags: ["区块链", "DeFi", "NFT", "Layer2", "加密货币"],
    content: "区块链技术发展的深度分析...",
    filePath: "/reports/blockchain-status-2024.html",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-12"),
    isFavorite: false,
    readStatus: "completed",
    fileSize: 134520,
    wordCount: 3650,
  },
  {
    id: "5",
    title: "2024年电商市场趋势报告",
    description:
      "分析2024年全球电商市场的发展趋势，包括新兴技术应用、消费者行为变化和市场机会。",
    category: "market-analysis",
    tags: ["电商", "市场趋势", "消费者行为", "数字化转型"],
    content: "2024年电商市场的全面分析...",
    filePath: "/reports/ecommerce-trends-2024.html",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-10"),
    isFavorite: true,
    readStatus: "reading",
    fileSize: 98340,
    wordCount: 2780,
  },
  {
    id: "6",
    title: "SaaS产品竞争格局分析",
    description:
      "深入分析当前SaaS市场的竞争格局，主要玩家的策略和差异化竞争优势。",
    category: "market-analysis",
    tags: ["SaaS", "竞争分析", "产品策略", "市场定位"],
    content: "SaaS产品市场的竞争格局深度分析...",
    filePath: "/reports/saas-competitive-landscape.html",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-08"),
    isFavorite: false,
    readStatus: "unread",
    fileSize: 112680,
    wordCount: 3120,
  },
  {
    id: "7",
    title: "iPhone 15 Pro 深度体验报告",
    description:
      "全面评测iPhone 15 Pro的设计、性能、摄影等各个方面，为消费者购买决策提供参考。",
    category: "product-review",
    tags: ["iPhone", "苹果", "手机评测", "消费电子"],
    content: "iPhone 15 Pro的详细评测和使用体验...",
    filePath: "/reports/iphone-15-pro-review.html",
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-01-05"),
    isFavorite: true,
    readStatus: "completed",
    fileSize: 87450,
    wordCount: 2450,
  },
  {
    id: "8",
    title: "MacBook Pro M3 性能测试",
    description:
      "深入测试MacBook Pro M3的性能表现，包括CPU、GPU、内存等各项指标的详细评估。",
    category: "product-review",
    tags: ["MacBook", "M3芯片", "性能测试", "苹果"],
    content: "MacBook Pro M3的性能测试详细报告...",
    filePath: "/reports/macbook-pro-m3-performance.html",
    createdAt: new Date("2023-12-25"),
    updatedAt: new Date("2024-01-02"),
    isFavorite: false,
    readStatus: "reading",
    fileSize: 156890,
    wordCount: 4340,
  },
  {
    id: "9",
    title: "智能家居产品对比评测",
    description:
      "对比评测市面上主流的智能家居产品，包括智能音箱、智能门锁、智能照明等。",
    category: "product-review",
    tags: ["智能家居", "IoT", "产品对比", "用户体验"],
    content: "智能家居产品的对比评测分析...",
    filePath: "/reports/smart-home-comparison.html",
    createdAt: new Date("2023-12-22"),
    updatedAt: new Date("2023-12-30"),
    isFavorite: true,
    readStatus: "unread",
    fileSize: 94320,
    wordCount: 2890,
  },
  {
    id: "10",
    title: "人工智能行业发展洞察",
    description:
      "深入分析人工智能行业的发展现状、技术突破和未来机遇，为投资和决策提供参考。",
    category: "industry-insights",
    tags: ["人工智能", "行业分析", "技术趋势", "投资机会"],
    content: "AI行业发展的深度洞察分析...",
    filePath: "/reports/ai-industry-insights.html",
    createdAt: new Date("2023-12-20"),
    updatedAt: new Date("2023-12-28"),
    isFavorite: false,
    readStatus: "completed",
    fileSize: 143670,
    wordCount: 3890,
  },
  {
    id: "11",
    title: "新能源汽车市场观察",
    description:
      "观察分析新能源汽车市场的最新发展动态，包括技术创新、政策影响和竞争格局。",
    category: "industry-insights",
    tags: ["新能源汽车", "电动车", "市场分析", "技术创新"],
    content: "新能源汽车市场的观察和分析...",
    filePath: "/reports/ev-market-observation.html",
    createdAt: new Date("2023-12-18"),
    updatedAt: new Date("2023-12-25"),
    isFavorite: true,
    readStatus: "reading",
    fileSize: 128450,
    wordCount: 3560,
  },
];

// 工具函数：根据分类ID获取报告
export const getReportsByCategory = (categoryId: string): Report[] => {
  return mockReports.filter((report) => report.category === categoryId);
};

// 工具函数：动态计算报告数量
export const calculateReportCounts = (
  categories: Category[],
  reports: Report[],
): Category[] => {
  return categories.map((category) => {
    const reportCount = reports.filter(
      (report) => report.category === category.id,
    ).length;
    const updatedCategory = { ...category, reportCount };

    if (category.children) {
      updatedCategory.children = calculateReportCounts(
        category.children,
        reports,
      );
    }

    return updatedCategory;
  });
};

// 工具函数：获取分类树结构
export const buildCategoryTree = (
  categories: Category[],
  reports: Report[],
): Category[] => {
  const tree: Category[] = [];
  const lookup: { [id: string]: Category } = {};

  // 计算报告数量
  const categoriesWithCounts = calculateReportCounts(categories, reports);

  // 创建查找表
  categoriesWithCounts.forEach((cat) => {
    lookup[cat.id] = { ...cat, children: [] };
  });

  // 构建树结构
  categoriesWithCounts.forEach((cat) => {
    if (cat.parentId && lookup[cat.parentId]) {
      lookup[cat.parentId].children!.push(lookup[cat.id]);
    } else {
      tree.push(lookup[cat.id]);
    }
  });

  return tree;
};
