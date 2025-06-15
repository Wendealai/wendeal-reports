#!/usr/bin/env node

/**
 * 清理代码中的 console.log 语句
 * 用法: node scripts/cleanup-logs.js
 */

const fs = require('fs');
const path = require('path');

// 需要处理的文件扩展名
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// 需要排除的目录
const EXCLUDE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build'];

// 需要保留的console方法（错误和警告）
const KEEP_CONSOLE = ['console.error', 'console.warn'];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

function shouldSkipDirectory(dirName) {
  return EXCLUDE_DIRS.includes(dirName);
}

function cleanupConsoleStatements(content) {
  // 匹配 console.log, console.info, console.debug 等，但保留 console.error 和 console.warn
  const consoleRegex = /console\.(log|info|debug|trace)\s*\([^)]*\);?\s*\n?/g;
  
  let cleanedContent = content.replace(consoleRegex, '');
  
  // 清理空行
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleanedContent;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalLines = content.split('\n').length;
    
    const cleanedContent = cleanupConsoleStatements(content);
    const cleanedLines = cleanedContent.split('\n').length;
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      const removedLines = originalLines - cleanedLines;
      console.log(`✅ ${filePath}: 移除了 ${removedLines} 行日志语句`);
      return { processed: true, removedLines };
    }
    
    return { processed: false, removedLines: 0 };
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
    return { processed: false, removedLines: 0 };
  }
}

function processDirectory(dirPath) {
  const stats = { filesProcessed: 0, totalRemovedLines: 0 };
  
  function walkDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const itemStat = fs.statSync(itemPath);
      
      if (itemStat.isDirectory()) {
        if (!shouldSkipDirectory(item)) {
          walkDirectory(itemPath);
        }
      } else if (itemStat.isFile() && shouldProcessFile(itemPath)) {
        const result = processFile(itemPath);
        if (result.processed) {
          stats.filesProcessed++;
          stats.totalRemovedLines += result.removedLines;
        }
      }
    }
  }
  
  walkDirectory(dirPath);
  return stats;
}

function main() {
  console.log('🧹 开始清理 console.log 语句...\n');
  
  const srcPath = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ src 目录不存在');
    process.exit(1);
  }
  
  const stats = processDirectory(srcPath);
  
  console.log('\n📊 清理完成统计:');
  console.log(`   处理的文件数: ${stats.filesProcessed}`);
  console.log(`   移除的代码行数: ${stats.totalRemovedLines}`);
  
  if (stats.filesProcessed > 0) {
    console.log('\n✨ 清理完成！建议运行测试确保功能正常。');
  } else {
    console.log('\n✅ 没有发现需要清理的日志语句。');
  }
}

if (require.main === module) {
  main();
} 