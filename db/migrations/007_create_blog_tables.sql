-- 建立 blog_categories 表格
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立 blog_tags 表格
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立 blog_posts 表格（如果不存在）
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  read_time INTEGER DEFAULT 5,
  seo_title VARCHAR(255),
  seo_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立 blog_post_tags 關聯表（多對多關係）
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id)
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post_id ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);

-- 建立更新 updated_at 的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 為每個表格建立更新 updated_at 的觸發器
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_tags_updated_at BEFORE UPDATE ON blog_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 建立更新分類文章數量的函數
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_categories 
    SET post_count = post_count + 1 
    WHERE id = NEW.category_id AND NEW.status = 'published';
  ELSIF TG_OP = 'UPDATE' THEN
    -- 如果分類改變
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      -- 減少舊分類的計數
      IF OLD.category_id IS NOT NULL AND OLD.status = 'published' THEN
        UPDATE blog_categories 
        SET post_count = GREATEST(0, post_count - 1) 
        WHERE id = OLD.category_id;
      END IF;
      -- 增加新分類的計數
      IF NEW.category_id IS NOT NULL AND NEW.status = 'published' THEN
        UPDATE blog_categories 
        SET post_count = post_count + 1 
        WHERE id = NEW.category_id;
      END IF;
    -- 如果狀態改變
    ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.category_id IS NOT NULL THEN
      IF NEW.status = 'published' AND OLD.status != 'published' THEN
        UPDATE blog_categories 
        SET post_count = post_count + 1 
        WHERE id = NEW.category_id;
      ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
        UPDATE blog_categories 
        SET post_count = GREATEST(0, post_count - 1) 
        WHERE id = NEW.category_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.category_id IS NOT NULL AND OLD.status = 'published' THEN
      UPDATE blog_categories 
      SET post_count = GREATEST(0, post_count - 1) 
      WHERE id = OLD.category_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 建立觸發器來自動更新分類文章數量
CREATE TRIGGER update_category_post_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION update_category_post_count();

-- 插入一些預設分類
INSERT INTO blog_categories (name, slug, description, color) VALUES
  ('技術文章', 'tech', '技術相關的文章和教學', '#3B82F6'),
  ('產品更新', 'product', '產品功能更新和公告', '#10B981'),
  ('教學指南', 'tutorial', '詳細的使用教學和指南', '#F59E0B'),
  ('最佳實踐', 'best-practices', '業界最佳實踐和經驗分享', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- 插入一些預設標籤
INSERT INTO blog_tags (name, slug, color) VALUES
  ('JavaScript', 'javascript', '#F7DF1E'),
  ('React', 'react', '#61DAFB'),
  ('Next.js', 'nextjs', '#000000'),
  ('TypeScript', 'typescript', '#3178C6'),
  ('Web開發', 'web-dev', '#FF6B6B'),
  ('教學', 'tutorial', '#4ECDC4'),
  ('初學者', 'beginner', '#95E1D3')
ON CONFLICT (name) DO NOTHING;