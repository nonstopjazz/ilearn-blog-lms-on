-- ============================================
-- 清理無效的課程申請資料
-- ============================================
-- ⚠️ 警告：此腳本會刪除資料！
-- 建議先執行 011_check_invalid_course_requests.sql 確認要刪除的資料
-- 此腳本會刪除 course_requests 表中不存在於 courses 表的課程申請

-- 安全措施：創建備份表
DO $$
BEGIN
    -- 如果備份表已存在，先刪除
    DROP TABLE IF EXISTS course_requests_backup;

    -- 創建備份
    CREATE TABLE course_requests_backup AS
    SELECT * FROM course_requests;

    RAISE NOTICE '✓ 已創建備份表 course_requests_backup';
END $$;

-- 顯示即將刪除的資料（最後確認）
SELECT
    'WARNING: 以下資料將被刪除' as message,
    cr.id as request_id,
    cr.course_id,
    cr.course_title,
    cr.user_id,
    cr.status,
    cr.created_at
FROM course_requests cr
LEFT JOIN courses c ON c.id = cr.course_id
WHERE c.id IS NULL
ORDER BY cr.created_at DESC;

-- 統計即將刪除的資料
DO $$
DECLARE
    delete_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO delete_count
    FROM course_requests cr
    LEFT JOIN courses c ON c.id = cr.course_id
    WHERE c.id IS NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE '準備刪除 % 個無效的課程申請', delete_count;
    RAISE NOTICE '========================================';
END $$;

-- ⚠️ 執行刪除操作
-- 取消下面這行的註解來執行刪除
-- DELETE FROM course_requests
-- WHERE course_id NOT IN (SELECT id FROM courses);

-- 或使用更安全的 LEFT JOIN 方式
/*
DELETE FROM course_requests
WHERE id IN (
    SELECT cr.id
    FROM course_requests cr
    LEFT JOIN courses c ON c.id = cr.course_id
    WHERE c.id IS NULL
);
*/

-- 刪除後的統計
DO $$
DECLARE
    remaining_requests INTEGER;
    valid_requests INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_requests FROM course_requests;

    SELECT COUNT(*) INTO valid_requests
    FROM course_requests cr
    INNER JOIN courses c ON c.id = cr.course_id;

    RAISE NOTICE '========================================';
    RAISE NOTICE '清理完成';
    RAISE NOTICE '========================================';
    RAISE NOTICE '剩餘課程申請數: %', remaining_requests;
    RAISE NOTICE '有效課程申請數: %', valid_requests;
    RAISE NOTICE '========================================';

    IF remaining_requests = valid_requests THEN
        RAISE NOTICE '✓ 所有課程申請都是有效的';
    ELSE
        RAISE WARNING '⚠ 還有 % 個無效的課程申請', remaining_requests - valid_requests;
    END IF;
END $$;

-- 清理說明
COMMENT ON TABLE course_requests_backup IS
'課程申請表的備份，創建於執行清理腳本時。如果需要恢復資料，可以從此表還原。';

-- 恢復資料的範例 SQL（如果需要的話）
/*
-- 恢復所有資料
INSERT INTO course_requests
SELECT * FROM course_requests_backup
ON CONFLICT (id) DO NOTHING;

-- 或只恢復特定課程的資料
INSERT INTO course_requests
SELECT * FROM course_requests_backup
WHERE course_id = 'specific_course_id'
ON CONFLICT (id) DO NOTHING;
*/

-- 最後驗證
SELECT
    'Verification: 所有課程申請的 course_id 都存在於 courses 表' as check_name,
    COUNT(*) as total_requests,
    COUNT(c.id) as valid_requests,
    CASE
        WHEN COUNT(*) = COUNT(c.id) THEN '✓ PASSED'
        ELSE '✗ FAILED'
    END as status
FROM course_requests cr
LEFT JOIN courses c ON c.id = cr.course_id;
