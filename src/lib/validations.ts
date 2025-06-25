import { z } from "zod";

// 用户相关验证
export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  username: z
    .string()
    .min(3, "用户名至少3个字符")
    .max(20, "用户名最多20个字符"),
  password: z.string().min(6, "密码至少6个字符").max(100, "密码最多100个字符"),
});

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

// 报告相关验证
export const createReportSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题最多200个字符"),
  content: z.string().min(1, "内容不能为空"),
  summary: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// 文件上传相关验证
export const createReportWithFileSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题最多200个字符"),
  content: z.string().min(1, "内容不能为空"),
  description: z.string().optional(),
  summary: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // 文件相关字段
  filePath: z.string().optional(),
  fileSize: z.number().min(0, "文件大小不能为负数").optional(),
  fileName: z.string().optional(),
  originalName: z.string().optional(),
  mimeType: z.string().optional(),
});

export const updateReportSchema = createReportSchema.partial();

// 分类相关验证
export const createCategorySchema = z.object({
  name: z.string().min(1, "分类名称不能为空").max(50, "分类名称最多50个字符"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// 标签相关验证
export const createTagSchema = z.object({
  name: z.string().min(1, "标签名称不能为空").max(30, "标签名称最多30个字符"),
  color: z.string().optional(),
});

export const updateTagSchema = createTagSchema.partial();

// 搜索相关验证
export const searchSchema = z.object({
  query: z.string().min(1, "搜索关键词不能为空"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// 保存搜索验证
export const saveSearchSchema = z.object({
  name: z.string().min(1, "搜索名称不能为空").max(50, "搜索名称最多50个字符"),
  query: z.string().min(1, "搜索关键词不能为空"),
  filters: z.record(z.any()).optional(),
});

// 类型导出
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type CreateReportWithFileInput = z.infer<
  typeof createReportWithFileSchema
>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type SaveSearchInput = z.infer<typeof saveSearchSchema>;
