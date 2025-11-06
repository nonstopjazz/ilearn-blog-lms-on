-- 018_add_multiple_images_support.sql
-- 新增多張圖片支援（含排序和註解功能）

-- 新增欄位來存儲多個圖片 URL（含註解）
ALTER TABLE essay_submissions
  ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- 新增註解
COMMENT ON COLUMN essay_submissions.image_urls IS '多張圖片 URL 陣列 (JSONB): [{"url": "...", "width": 1920, "height": 1080, "size": 123456, "order": 0, "annotation": "第一段"}, ...]';

-- 更新檢查約束：支援多張圖片
ALTER TABLE essay_submissions
  DROP CONSTRAINT IF EXISTS essay_content_check;

ALTER TABLE essay_submissions
  ADD CONSTRAINT essay_content_check CHECK (
    (submission_type = 'image' AND (image_url IS NOT NULL OR jsonb_array_length(image_urls) > 0)) OR
    (submission_type = 'text' AND essay_content IS NOT NULL)
  );
