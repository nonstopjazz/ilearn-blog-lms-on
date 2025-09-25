-- 同步課程資料：確保所有在 course_requests 中的課程都存在於 course_lessons 表中
-- 這樣才能滿足外鍵約束

-- 首先，插入所有在 course_requests 中但不在 course_lessons 中的課程
INSERT INTO course_lessons (course_id, title, lesson_order, is_published, created_at, updated_at)
SELECT DISTINCT
    cr.course_id,
    cr.course_title,
    1 as lesson_order,  -- 預設順序為 1
    true as is_published,  -- 預設為已發布
    NOW() as created_at,
    NOW() as updated_at
FROM course_requests cr
WHERE cr.status = 'approved'
AND NOT EXISTS (
    SELECT 1 FROM course_lessons cl
    WHERE cl.course_id = cr.course_id
)
ON CONFLICT (course_id) DO NOTHING;  -- 如果 course_id 已存在，則忽略

-- 確認插入結果
DO $$
DECLARE
    inserted_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT course_id) INTO inserted_count
    FROM course_lessons;

    RAISE NOTICE '課程同步完成，course_lessons 表中現有 % 個課程', inserted_count;
END $$;