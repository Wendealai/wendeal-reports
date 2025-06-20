// 安全的浏览器API工具函数
// 用于处理SSR环境下的浏览器API调用

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // 静默失败
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // 静默失败
    }
  }
};

export const safeWindow = {
  addEventListener: (event: string, handler: EventListener): void => {
    if (typeof window !== 'undefined') {
      window.addEventListener(event, handler);
    }
  },
  
  removeEventListener: (event: string, handler: EventListener): void => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(event, handler);
    }
  },
  
  dispatchEvent: (event: Event): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  },
  
  confirm: (message: string): boolean => {
    if (typeof window === 'undefined') return false;
    return window.confirm(message);
  },
  
  open: (url: string, target?: string): void => {
    if (typeof window !== 'undefined') {
      window.open(url, target);
    }
  }
};

// 检查是否在客户端环境
export const isClient = typeof window !== 'undefined';

// 安全的JSON解析
export const safeJsonParse = <T>(str: string, fallback: T): T => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}; 