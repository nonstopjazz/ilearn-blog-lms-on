-- Migration: 將 assignments 表的 course_id 改為 nullable
-- 原因: 專案作業可能不屬於特定課程
-- 日期: 2025-10-20

BEGIN;

-- 修改 course_id 欄位為 nullable
ALTER TABLE assignments
ALTER COLUMN course_id DROP NOT NULL;

-- 添加註解說明
COMMENT ON COLUMN assignments.course_id IS '課程 ID (可選,專案作業可能不屬於特定課程)';

COMMIT;

-- 驗證修改
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'assignments' AND column_name = 'course_id';
