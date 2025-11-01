-- ===================================================
-- Migration: 為 student_tasks 表添加可見性控制和 RLS 政策
-- ===================================================
-- 目的：
-- 1. 添加 visible_to_student 欄位控制作業是否向學生顯示
-- 2. 添加 graded_at 欄位記錄評分/登記時間
-- 3. 設置 RLS 政策確保正確的權限控制
-- ===================================================

-- 1. 為 student_tasks 表添加新欄位
ALTER TABLE student_tasks
ADD COLUMN IF NOT EXISTS visible_to_student BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS graded_by UUID;

-- 2. 添加註解說明
COMMENT ON COLUMN student_tasks.visible_to_student IS '是否向學生顯示此作業（只有在管理員登記完成狀況後才為 true）';
COMMENT ON COLUMN student_tasks.graded_at IS '管理員登記完成狀況的時間';
COMMENT ON COLUMN student_tasks.graded_by IS '登記完成狀況的管理員 ID';

-- 3. 啟用 RLS
ALTER TABLE student_tasks ENABLE ROW LEVEL SECURITY;

-- 4. 刪除舊的政策（如果存在）
DROP POLICY IF EXISTS "student_tasks_select_policy" ON student_tasks;
DROP POLICY IF EXISTS "student_tasks_insert_policy" ON student_tasks;
DROP POLICY IF EXISTS "student_tasks_update_policy" ON student_tasks;
DROP POLICY IF EXISTS "student_tasks_delete_policy" ON student_tasks;

-- 5. 創建新的 RLS 政策

-- 學生只能查看 visible_to_student = true 且 student_id = 自己的作業
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
  -- 學生只能看到自己的且 visible_to_student = true 的作業
  (
    student_id = auth.uid()
    AND visible_to_student = true
  )
);

-- 只有管理員可以新增作業
CREATE POLICY "student_tasks_insert_policy" ON student_tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 只有管理員可以更新作業
CREATE POLICY "student_tasks_update_policy" ON student_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 只有管理員可以刪除作業
CREATE POLICY "student_tasks_delete_policy" ON student_tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 6. 創建一個函數來自動設置 visible_to_student
-- 當管理員更新每日作業的 daily_completion 或一次性作業的 status 時，自動設置為可見
CREATE OR REPLACE FUNCTION auto_set_task_visibility()
RETURNS TRIGGER AS $$
BEGIN
  -- 檢查是否是管理員操作
  IF EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin') THEN
    -- 如果是每日任務且有 daily_completion 數據
    IF NEW.task_type = 'daily' AND NEW.daily_completion IS NOT NULL AND jsonb_array_length(NEW.daily_completion) > 0 THEN
      NEW.visible_to_student = true;
      NEW.graded_at = NOW();
      NEW.graded_by = auth.uid();
    END IF;

    -- 如果是一次性任務且狀態為已完成或進行中
    IF NEW.task_type = 'onetime' AND NEW.status IN ('completed', 'in_progress') AND OLD.status = 'assigned' THEN
      NEW.visible_to_student = true;
      NEW.graded_at = NOW();
      NEW.graded_by = auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 創建觸發器
DROP TRIGGER IF EXISTS auto_set_task_visibility_trigger ON student_tasks;
CREATE TRIGGER auto_set_task_visibility_trigger
  BEFORE UPDATE ON student_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_task_visibility();

-- 8. 為現有的已有完成記錄的作業設置 visible_to_student = true
UPDATE student_tasks
SET visible_to_student = true,
    graded_at = updated_at
WHERE (
  -- 每日任務且有完成記錄
  (task_type = 'daily' AND daily_completion IS NOT NULL AND jsonb_array_length(daily_completion) > 0)
  OR
  -- 一次性任務且狀態不是 assigned
  (task_type = 'onetime' AND status != 'assigned')
)
AND visible_to_student = false;

-- 9. 驗證設置
SELECT
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE visible_to_student = true) as visible_tasks,
  COUNT(*) FILTER (WHERE visible_to_student = false) as hidden_tasks
FROM student_tasks;

-- 完成訊息
SELECT '✅ student_tasks 可見性控制和 RLS 政策已設置完成！' as status;
