-- 將 course_lessons 的 video_duration 從「分鐘」改為「秒數」儲存
-- 這樣可以支援精確到秒的時長輸入（例如：1分30秒 = 90秒）

-- Step 1: 將現有的分鐘數轉換為秒數（乘以 60）
-- 注意：這會更新所有現有記錄
UPDATE course_lessons
SET video_duration = video_duration * 60
WHERE video_duration IS NOT NULL;

-- Step 2: 新增註解說明欄位現在儲存的是秒數
COMMENT ON COLUMN course_lessons.video_duration IS '影片時長（秒數）- 例如：90 表示 1分30秒';

-- 確認轉換結果
DO $$
DECLARE
    updated_count INTEGER;
    sample_record RECORD;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM course_lessons
    WHERE video_duration IS NOT NULL;

    RAISE NOTICE '已轉換 % 筆課程單元的時長資料（分鐘 → 秒數）', updated_count;

    -- 顯示前3筆轉換後的範例資料
    RAISE NOTICE '--- 轉換後範例資料 ---';
    FOR sample_record IN
        SELECT id, title, video_duration
        FROM course_lessons
        WHERE video_duration IS NOT NULL
        LIMIT 3
    LOOP
        RAISE NOTICE '課程: % | 時長: % 秒 (% 分 % 秒)',
            sample_record.title,
            sample_record.video_duration,
            sample_record.video_duration / 60,
            sample_record.video_duration % 60;
    END LOOP;
END $$;
