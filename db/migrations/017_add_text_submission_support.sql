-- 017_add_text_submission_support.sql
-- 新增文字提交功能支援

-- 新增欄位
ALTER TABLE essay_submissions
  -- 提交類型：image（圖片）或 text（文字）
  ADD COLUMN IF NOT EXISTS submission_type VARCHAR(10) DEFAULT 'image'
    CHECK (submission_type IN ('image', 'text')),

  -- 文字作文內容
  ADD COLUMN IF NOT EXISTS essay_content TEXT;

-- 修改現有欄位為可選（支援純文字提交）
ALTER TABLE essay_submissions
  ALTER COLUMN image_url DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL;

-- 新增註解
COMMENT ON COLUMN essay_submissions.submission_type IS '提交類型：image（圖片上傳）或 text（文字輸入）';
COMMENT ON COLUMN essay_submissions.essay_content IS '文字作文內容（當 submission_type = text 時使用）';

-- 新增檢查約束：確保至少有一種內容
ALTER TABLE essay_submissions
  ADD CONSTRAINT essay_content_check CHECK (
    (submission_type = 'image' AND image_url IS NOT NULL) OR
    (submission_type = 'text' AND essay_content IS NOT NULL)
  );
