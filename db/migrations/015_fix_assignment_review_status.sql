-- ===================================================
-- Migration: 修正作業檢查狀態邏輯
-- ===================================================
-- 目的：
-- 1. 移除 visible_to_student 欄位（學生應該立即看到作業）
-- 2. 新增 review_status 欄位表示老師是否已檢查
-- 3. 學生可以立即看到作業，但根據 review_status 顯示不同狀態
-- ===================================================

-- 1. 移除舊的觸發器和函數
DROP TRIGGER IF EXISTS auto_set_task_visibility_trigger ON student_tasks;
DROP FUNCTION IF EXISTS auto_set_task_visibility();

-- 2. 新增 review_status 欄位
ALTER TABLE student_tasks
ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed'));

-- 3. 移除 visible_to_student 欄位（如果你想保留舊數據可以先不刪除，但建議刪除）
-- ALTER TABLE student_tasks DROP COLUMN IF EXISTS visible_to_student;

-- 4. 更新 RLS 政策 - 學生可以看到所有自己的作業
DROP POLICY IF EXISTS "student_tasks_select_policy" ON student_tasks;

CREATE POLICY "student_tasks_select_policy" ON student_tasks
FOR SELECT
USING (
  -- 管理員可以看到所有作業
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR
  -- 學生可以看到所有自己的作業（無論 review_status）
  student_id = auth.uid()
);

-- 5. 創建自動更新 review_status 的函數
CREATE OR REPLACE FUNCTION auto_set_review_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 檢查是否是管理員操作
  IF EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin') THEN
    -- 如果是每日任務且有 daily_completion 數據，設為已檢查
    IF NEW.task_type = 'daily' AND NEW.daily_completion IS NOT NULL AND jsonb_array_length(NEW.daily_completion) > 0 THEN
      -- 只有在從 pending 變更時才更新
      IF OLD.review_status = 'pending' OR OLD.review_status IS NULL THEN
        NEW.review_status = 'reviewed';
        NEW.graded_at = NOW();
        NEW.graded_by = auth.uid();
      END IF;
    END IF;

    -- 如果是一次性任務且狀態從 assigned 改變，設為已檢查
    IF NEW.task_type = 'onetime' AND NEW.status != 'assigned' AND (OLD.status = 'assigned' OR OLD.status IS NULL) THEN
      NEW.review_status = 'reviewed';
      NEW.graded_at = NOW();
      NEW.graded_by = auth.uid();
    END IF;

    -- 如果管理員手動設置了 score 或 teacher_feedback，也設為已檢查
    IF (NEW.score IS NOT NULL AND OLD.score IS NULL) OR (NEW.teacher_feedback IS NOT NULL AND OLD.teacher_feedback IS NULL) THEN
      NEW.review_status = 'reviewed';
      NEW.graded_at = NOW();
      NEW.graded_by = auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 創建觸發器
CREATE TRIGGER auto_set_review_status_trigger
  BEFORE UPDATE ON student_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_review_status();

-- 7. 更新現有數據
-- 將有完成記錄的作業設為 reviewed
UPDATE student_tasks
SET review_status = 'reviewed',
    graded_at = updated_at
WHERE review_status = 'pending'
AND (
  -- 每日任務且有完成記錄
  (task_type = 'daily' AND daily_completion IS NOT NULL AND jsonb_array_length(daily_completion) > 0)
  OR
  -- 一次性任務且狀態不是 assigned
  (task_type = 'onetime' AND status != 'assigned')
  OR
  -- 有評分或評語
  score IS NOT NULL
  OR
  teacher_feedback IS NOT NULL
);

-- 8. 如果要保留向後兼容，將 visible_to_student = true 的作業也設為 reviewed
UPDATE student_tasks
SET review_status = 'reviewed'
WHERE visible_to_student = true
AND review_status = 'pending';

-- 9. 註解說明
COMMENT ON COLUMN student_tasks.review_status IS '檢查狀態: pending=待檢查（老師尚未填寫完成狀況）, reviewed=已檢查（老師已填寫完成狀況）';

-- 10. 驗證設置
SELECT
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE review_status = 'pending') as pending_tasks,
  COUNT(*) FILTER (WHERE review_status = 'reviewed') as reviewed_tasks,
  COUNT(*) FILTER (WHERE task_type = 'daily') as daily_tasks,
  COUNT(*) FILTER (WHERE task_type = 'onetime') as onetime_tasks
FROM student_tasks;

-- 完成訊息
SELECT '✅ 作業檢查狀態邏輯已修正完成！學生現在可以立即看到所有作業，並根據 review_status 顯示不同狀態。' as status;
