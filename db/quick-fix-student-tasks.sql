-- ===================================================
-- 快速修復腳本：確保 student_tasks 表存在
-- ===================================================
-- 使用方式：
-- 1. 登入 Supabase Dashboard (https://supabase.com/dashboard)
-- 2. 選擇您的專案
-- 3. 進入 SQL Editor
-- 4. 貼上並執行此腳本
-- ===================================================

-- 檢查並創建 update_updated_at 函數（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建 student_tasks 表（如果不存在）
CREATE TABLE IF NOT EXISTS student_tasks (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    task_description TEXT NOT NULL,
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('daily', 'onetime')),
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
    completion_date DATE,

    -- 每日作業專用欄位
    daily_streak INTEGER DEFAULT 0,
    daily_total_days INTEGER DEFAULT 0,
    daily_completed_days INTEGER DEFAULT 0,
    daily_completion JSONB DEFAULT '[]'::jsonb,

    -- 一次性作業專用欄位
    score DECIMAL(5,2),
    max_score DECIMAL(5,2) DEFAULT 100,
    teacher_feedback TEXT,
    student_notes TEXT,

    -- 通用欄位
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category VARCHAR(50),
    estimated_duration INTEGER,
    actual_duration INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT student_tasks_student_idx CHECK (student_id IS NOT NULL)
);

-- 創建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_date ON student_tasks(student_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON student_tasks(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_tasks_type ON student_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_student_tasks_due_date ON student_tasks(due_date) WHERE status != 'completed';

-- 刪除現有觸發器（如果存在）
DROP TRIGGER IF EXISTS update_student_tasks_updated_at ON student_tasks;

-- 創建觸發器
CREATE TRIGGER update_student_tasks_updated_at
    BEFORE UPDATE ON student_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 創建或替換自動更新逾期任務的函數
CREATE OR REPLACE FUNCTION update_overdue_tasks()
RETURNS void AS $$
BEGIN
    UPDATE student_tasks
    SET status = 'overdue'
    WHERE status IN ('assigned', 'in_progress')
    AND due_date < CURRENT_DATE
    AND task_type = 'onetime';
END;
$$ LANGUAGE plpgsql;

-- 添加註解
COMMENT ON TABLE student_tasks IS '學生任務表 - 記錄每堂課交代的作業';
COMMENT ON COLUMN student_tasks.task_type IS '任務類型: daily=每日任務, onetime=一次性任務';
COMMENT ON COLUMN student_tasks.daily_completion IS '每日完成記錄 JSON 陣列';
COMMENT ON COLUMN student_tasks.daily_streak IS '連續完成天數';

-- 驗證表是否創建成功
SELECT
    tablename,
    schemaname,
    tablespace
FROM pg_tables
WHERE tablename = 'student_tasks';

-- 顯示表結構
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'student_tasks'
ORDER BY ordinal_position;

-- 測試插入權限（使用假的 UUID，會因為外鍵失敗，但這證明表存在）
-- 如果報錯 "violates foreign key constraint"，這是好消息！代表表存在且權限正常
-- 如果報錯 "relation does not exist"，代表表還沒創建成功
DO $$
BEGIN
    INSERT INTO student_tasks (
        student_id,
        task_description,
        task_type,
        due_date
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'TEST - 請忽略',
        'onetime',
        '2099-12-31'
    );

    RAISE NOTICE '✓ 插入成功（不應該出現此訊息）';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE '✓ 表存在且權限正常（外鍵錯誤是預期的）';
    WHEN OTHERS THEN
        RAISE EXCEPTION '✗ 發生錯誤: %', SQLERRM;
END $$;

-- 完成訊息
SELECT '✅ student_tasks 表已準備就緒！' as status;
