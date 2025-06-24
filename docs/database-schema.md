# Wendeal Reports 数据库设计

## 数据库表结构

### 1. 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 分类表 (categories)
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  color VARCHAR(7), -- 十六进制颜色代码
  icon VARCHAR(50), -- 图标名称
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

### 3. 报告表 (reports)
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT, -- HTML内容
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_path TEXT, -- 原始文件路径
  file_name VARCHAR(255), -- 原始文件名
  file_size BIGINT, -- 文件大小（字节）
  file_type VARCHAR(50), -- MIME类型
  word_count INTEGER,
  read_status VARCHAR(20) DEFAULT 'unread' CHECK (read_status IN ('unread', 'reading', 'completed')),
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_reports_category_id ON reports(category_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_read_status ON reports(read_status);
CREATE INDEX idx_reports_is_favorite ON reports(is_favorite);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- 全文搜索索引
CREATE INDEX idx_reports_search ON reports USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### 4. 标签表 (tags)
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7), -- 十六进制颜色代码
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
```

### 5. 报告标签关联表 (report_tags)
```sql
CREATE TABLE report_tags (
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (report_id, tag_id)
);
```

### 6. 搜索历史表 (search_history)
```sql
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB, -- 搜索过滤条件
  result_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);
```

### 7. 保存的搜索表 (saved_searches)
```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  query TEXT NOT NULL,
  filters JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
```

### 8. 文件存储表 (file_storage)
```sql
CREATE TABLE file_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  checksum VARCHAR(64), -- SHA-256校验和
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_storage_user_id ON file_storage(user_id);
CREATE INDEX idx_file_storage_checksum ON file_storage(checksum);
```

## 关系说明

1. **用户 -> 分类**：一对多关系，用户可以创建多个分类
2. **分类 -> 分类**：自引用关系，支持分类层级结构
3. **用户 -> 报告**：一对多关系，用户可以上传多个报告
4. **分类 -> 报告**：一对多关系，一个分类可以包含多个报告
5. **报告 -> 标签**：多对多关系，通过 report_tags 表关联
6. **用户 -> 标签**：一对多关系，用户可以创建多个标签

## 数据完整性约束

1. **级联删除**：删除用户时，删除其所有相关数据
2. **外键约束**：确保数据引用完整性
3. **检查约束**：确保枚举值的有效性
4. **唯一约束**：防止重复数据

## 性能优化

1. **索引策略**：为常用查询字段创建索引
2. **分区策略**：按时间分区大表（如搜索历史）
3. **全文搜索**：使用 PostgreSQL 的全文搜索功能
4. **缓存策略**：Redis 缓存热点数据 