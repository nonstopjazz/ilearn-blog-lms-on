-- ============================================
-- 檢查無效的課程申請資料
-- ============================================
-- 此腳本用於檢查 course_requests 表中存在但 courses 表中不存在的課程
-- 執行此腳本不會刪除任何資料，只是用來檢視問題

-- 檢查 1: 顯示所有無效的課程申請
SELECT
    cr.id as request_id,
    cr.course_id,
    cr.course_title,
    cr.user_id,
    cr.status,
    cr.created_at,
    cr.reviewed_at,
    'courses 表中不存在' as issue
FROM course_requests cr
LEFT JOIN courses c ON c.id = cr.course_id
WHERE c.id IS NULL
ORDER BY cr.created_at DESC;

-- 檢查 2: 統計無效課程申請的數量
SELECT
    COUNT(*) as total_invalid_requests,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_invalid_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invalid_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_invalid_requests
FROM course_requests cr
LEFT JOIN courses c ON c.id = cr.course_id
WHERE c.id IS NULL;

-- 檢查 3: 按課程 ID 分組統計
SELECT
    cr.course_id,
    cr.course_title,
    COUNT(*) as request_count,
    COUNT(CASE WHEN cr.status = 'approved' THEN 1 END) as approved_count,
    MIN(cr.created_at) as first_request_date,
    MAX(cr.created_at) as last_request_date
FROM course_requests cr
LEFT JOIN courses c ON c.id = cr.course_id
WHERE c.id IS NULL
GROUP BY cr.course_id, cr.course_title
ORDER BY request_count DESC;

-- 檢查 4: 檢查是否有對應的課程單元資料
SELECT
    cr.course_id,
    cr.course_title,
    COUNT(cl.id) as lesson_count,
    COUNT(CASE WHEN cr.status = 'approved' THEN 1 END) as approved_request_count
FROM course_requests cr
LEFT JOIN courses c ON c.id = cr.course_id
LEFT JOIN course_lessons cl ON cl.course_id = cr.course_id
WHERE c.id IS NULL
GROUP BY cr.course_id, cr.course_title
HAVING COUNT(cl.id) > 0;

-- 檢查 5: 列出所有真實存在的課程（用於對比）
SELECT
    c.id,
    c.title,
    c.status,
    c.created_at,
    COUNT(DISTINCT cr.id) as total_requests,
    COUNT(DISTINCT CASE WHEN cr.status = 'approved' THEN cr.id END) as approved_requests,
    COUNT(DISTINCT cl.id) as lesson_count
FROM courses c
LEFT JOIN course_requests cr ON cr.course_id = c.id
LEFT JOIN course_lessons cl ON cl.course_id = c.id
GROUP BY c.id, c.title, c.status, c.created_at
ORDER BY c.created_at DESC;

-- 檢查結果摘要
DO $$
DECLARE
    total_requests INTEGER;
    invalid_requests INTEGER;
    total_courses INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_requests FROM course_requests;
    SELECT COUNT(*) INTO invalid_requests
    FROM course_requests cr
    LEFT JOIN courses c ON c.id = cr.course_id
    WHERE c.id IS NULL;
    SELECT COUNT(*) INTO total_courses FROM courses;

    RAISE NOTICE '========================================';
    RAISE NOTICE '資料庫健康檢查摘要';
    RAISE NOTICE '========================================';
    RAISE NOTICE '總課程申請數: %', total_requests;
    RAISE NOTICE '無效課程申請數: % (%.1f%%)', invalid_requests,
        CASE WHEN total_requests > 0
        THEN (invalid_requests::FLOAT / total_requests * 100)
        ELSE 0 END;
    RAISE NOTICE '真實課程數: %', total_courses;
    RAISE NOTICE '========================================';

    IF invalid_requests > 0 THEN
        RAISE WARNING '發現 % 個無效的課程申請！建議執行清理腳本', invalid_requests;
    ELSE
        RAISE NOTICE '✓ 資料庫狀態良好，沒有發現無效的課程申請';
    END IF;
END $$;
