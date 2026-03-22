-- 添加搜索向量列
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 创建 GIN 索引（加速全文搜索）
CREATE INDEX IF NOT EXISTS idx_documents_search_vector ON documents USING GIN(search_vector);

-- 创建触发函数：在 INSERT 或 UPDATE title/content 时自动更新 search_vector
-- 使用 'simple' 配置（不分词，按空格/标点拆分），中英文通用
-- 标题权重 A（最高），内容权重 B
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_document_search_vector ON documents;
CREATE TRIGGER trg_document_search_vector
  BEFORE INSERT OR UPDATE OF title, content ON documents
  FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

-- 回填已有数据的 search_vector
UPDATE documents SET search_vector =
  setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(content, '')), 'B');
