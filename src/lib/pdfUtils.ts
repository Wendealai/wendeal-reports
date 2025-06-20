/**
 * PDF 处理工具函数
 * 基于 PDF.js 和 react-pdf 的最佳实践
 */

import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
}

export interface PDFMetadata {
  title: string;
  description: string;
  pageCount: number;
  textContent: string;
  wordCount: number;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * 从PDF文件中提取文本内容
 * @param file PDF文件对象
 * @returns 提取的文本内容
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // 遍历所有页面提取文本
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // 组合文本项
      const pageText = textContent.items
        .filter((item): item is any => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF文本提取失败:', error);
    throw new Error('无法提取PDF文本内容');
  }
}

/**
 * 从PDF文件中提取完整元数据
 * @param file PDF文件对象
 * @returns PDF元数据对象
 */
export async function extractPDFMetadata(file: File): Promise<PDFMetadata> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // 获取PDF信息
    const metadata = await pdf.getMetadata();
    const info = metadata.info as any; // PDF.js info对象类型
    
    // 提取文本内容
    const textContent = await extractTextFromPDF(file);
    
    // 计算字数（去除多余空白字符）
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    const wordCount = cleanText ? cleanText.split(' ').length : 0;
    
    // 生成标题
    const title = info?.Title || 
                  file.name.replace(/\.pdf$/i, '') || 
                  '未命名PDF文档';
    
    // 生成描述（取前200字符）
    const description = generatePDFDescription(textContent, info?.Subject);
    
    return {
      title,
      description,
      pageCount: pdf.numPages,
      textContent,
      wordCount,
      author: info?.Author || undefined,
      subject: info?.Subject || undefined,
      keywords: info?.Keywords || undefined,
      creator: info?.Creator || undefined,
      producer: info?.Producer || undefined,
      creationDate: info?.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined,
    };
  } catch (error) {
    console.error('PDF元数据提取失败:', error);
    throw new Error('无法提取PDF元数据');
  }
}

/**
 * 生成PDF描述
 * @param textContent 文本内容
 * @param subject PDF主题（如果有）
 * @returns 生成的描述
 */
function generatePDFDescription(textContent: string, subject?: string): string {
  // 如果有主题，优先使用
  if (subject && subject.trim()) {
    return subject.trim();
  }
  
  // 清理文本内容
  const cleanText = textContent
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleanText) {
    return 'PDF文档内容';
  }
  
  // 截取前200个字符作为描述
  const maxLength = 200;
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  // 在句号或感叹号处截断，避免截断句子
  const truncated = cleanText.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > 50) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  return truncated + '...';
}

/**
 * 验证PDF文件
 * @param file 文件对象
 * @returns 验证错误信息，null表示验证通过
 */
export function validatePDFFile(file: File): string | null {
  // 检查文件类型
  if (!file.type.includes('application/pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    return '只支持 PDF 文件';
  }
  
  // 检查文件大小（最大50MB）
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return '文件大小不能超过 50MB';
  }
  
  // 检查文件大小最小值（至少1KB）
  if (file.size < 1024) {
    return 'PDF文件过小，可能损坏';
  }
  
  return null;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 从PDF文件提取关键词标签
 * @param textContent PDF文本内容
 * @param keywords PDF元数据中的关键词
 * @returns 提取的标签数组
 */
export function extractPDFTags(textContent: string, keywords?: string): string[] {
  const tags: string[] = [];
  
  // 从元数据关键词提取
  if (keywords) {
    const keywordTags = keywords
      .split(/[,;，；]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 20);
    tags.push(...keywordTags);
  }
  
  // 从文本内容中提取常见技术关键词
  const commonTerms = [
    '技术', '分析', '研究', '报告', '市场', '产品', '开发', '设计',
    '系统', '方案', '策略', '评估', '测试', '性能', '安全', '数据',
    'AI', '人工智能', '机器学习', '深度学习', '区块链', '云计算',
    'React', 'JavaScript', 'Python', 'Java', 'TypeScript', 'Node.js'
  ];
  
  const lowerText = textContent.toLowerCase();
  commonTerms.forEach(term => {
    if (lowerText.includes(term.toLowerCase()) && !tags.includes(term)) {
      tags.push(term);
    }
  });
  
  // 限制标签数量和去重
  return Array.from(new Set(tags)).slice(0, 10);
}

/**
 * 检查PDF是否包含图片
 * @param file PDF文件
 * @returns 是否包含图片
 */
export async function checkPDFHasImages(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // 检查第一页是否有图片资源
    if (pdf.numPages > 0) {
      const page = await pdf.getPage(1);
      const operatorList = await page.getOperatorList();
      
      // 查找图片相关操作
      return operatorList.fnArray.some((fn: number) => 
        fn === pdfjsLib.OPS.paintImageXObject || 
        fn === pdfjsLib.OPS.paintInlineImageXObject
      );
    }
    
    return false;
  } catch (error) {
    console.warn('检查PDF图片失败:', error);
    return false;
  }
} 