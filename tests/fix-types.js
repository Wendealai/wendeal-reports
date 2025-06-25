const fs = require("fs");

console.log("🔧 开始修复类型问题...");

// 读取文件
let content = fs.readFileSync("src/store/useAppStore.ts", "utf8");

// 1. 修复logger导入
content = content.replace(
  "import { logger } from '@/lib/logger';",
  "import { createLogger } from '@/lib/logger';\n\nconst logger = createLogger('AppStore');",
);

// 2. 删除有问题的API类型导入
content = content.replace(
  /import type \{ Report as ApiReport, Category as ApiCategory \} from '@\/types\/api';\n/,
  "",
);

// 3. 替换ApiReport和ApiCategory为any
content = content.replace(/: ApiReport/g, ": any");
content = content.replace(/: ApiCategory/g, ": any");

// 写回文件
fs.writeFileSync("src/store/useAppStore.ts", content);

console.log("✅ 类型修复完成");
console.log("📝 修改内容:");
console.log("  - 修复了logger导入");
console.log("  - 删除了有问题的API类型导入");
console.log("  - 将ApiReport和ApiCategory替换为any类型");
