/**
 * HTML处理工具函数
 */

/**
 * 从HTML字符串中提取纯文本，去除所有HTML标签
 * @param html HTML字符串
 * @param maxLength 最大长度，超过会截断并添加省略号
 * @returns 纯文本字符串
 */
export function stripHtmlTags(html: string, maxLength?: number): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 使用浏览器DOMParser去除HTML标签（客户端）
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const textContent = doc.body?.textContent || doc.textContent || '';
      const cleanText = textContent.replace(/\s+/g, ' ').trim();
      
      if (maxLength && cleanText.length > maxLength) {
        return cleanText.substring(0, maxLength) + '...';
      }
      
      return cleanText;
    } catch (error) {
      console.warn('Error parsing HTML with DOMParser:', error);
      // 降级到正则表达式方法
      return stripHtmlWithRegex(html, maxLength);
    }
  }

  // 服务端或DOMParser不可用时使用正则表达式
  return stripHtmlWithRegex(html, maxLength);
}

/**
 * 使用正则表达式去除HTML标签（备用方法）
 * @param html HTML字符串
 * @param maxLength 最大长度
 * @returns 纯文本字符串
 */
function stripHtmlWithRegex(html: string, maxLength?: number): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 去除HTML标签
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除script标签及内容
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // 移除style标签及内容
    .replace(/<[^>]*>/g, '')                           // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ')                           // 替换&nbsp;为空格
    .replace(/&lt;/g, '<')                             // 解码HTML实体
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')                              // 合并多个空格
    .trim();

  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }

  return text;
}

/**
 * 从HTML内容中提取描述文本
 * @param html HTML字符串
 * @param maxLength 最大长度，默认200字符
 * @returns 描述文本
 */
export function extractDescriptionFromHtml(html: string, maxLength = 200): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 先尝试从meta标签提取描述
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // 尝试从meta标签获取描述
      const metaDescription = 
        doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
      
      if (metaDescription && metaDescription.trim()) {
        const cleanMeta = metaDescription.trim();
        return cleanMeta.length > maxLength 
          ? cleanMeta.substring(0, maxLength) + '...' 
          : cleanMeta;
      }
    } catch (error) {
      console.warn('Error extracting meta description:', error);
    }
  }

  // 如果没有meta描述，从正文提取
  return stripHtmlTags(html, maxLength);
}

/**
 * 检查字符串是否包含HTML标签
 * @param text 要检查的字符串
 * @returns 是否包含HTML标签
 */
export function containsHtmlTags(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // 检查是否包含HTML标签的简单正则
  const htmlTagRegex = /<[^>]*>/;
  return htmlTagRegex.test(text);
}

/**
 * 安全地渲染可能包含HTML的文本
 * 如果包含HTML标签，则去除标签；否则直接返回
 * @param text 文本内容
 * @param maxLength 最大长度
 * @returns 安全的文本内容
 */
export function safeTextContent(text: string, maxLength?: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (containsHtmlTags(text)) {
    return stripHtmlTags(text, maxLength);
  }

  if (maxLength && text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }

  return text;
} 