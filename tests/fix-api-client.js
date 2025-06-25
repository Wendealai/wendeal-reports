const fs = require("fs");

console.log("🔧 修复 api-client.ts 文件...");

const filePath = "src/lib/api-client.ts";
let content = fs.readFileSync(filePath, "utf8");

// 在文件开头添加logger导入
const newHeader = `import { createLogger } from '@/lib/logger';

const logger = createLogger('ApiClient');

`;

// 将新的头部添加到现有内容前面
content = newHeader + content;

// 写回文件
fs.writeFileSync(filePath, content, "utf8");

console.log("✅ api-client.ts 修复完成！");
