-- 建立學生任務表 (每堂課交代的作業)
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
    daily_completion JSONB DEFAULT '[]'::jsonb,  -- [{date: "2025-01-15", completed: true}, ...]

    -- 一次性作業專用欄位
    score DECIMAL(5,2),
    max_score DECIMAL(5,2) DEFAULT 100,
    teacher_feedback TEXT,
    student_notes TEXT,

    -- 通用欄位
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category VARCHAR(50),  -- 分類(閱讀/寫作/背單字/聽力等)
    estimated_duration INTEGER,  -- 預估所需時間(分鐘)
    actual_duration INTEGER,     -- 實際花費時間(分鐘)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 索引
    CONSTRAINT student_tasks_student_idx CHECK (student_id IS NOT NULL)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_date ON student_tasks(student_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON student_tasks(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_tasks_type ON student_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_student_tasks_due_date ON student_tasks(due_date) WHERE status != 'completed';

-- 建立觸發器自動更新 updated_at
CREATE TRIGGER update_student_tasks_updated_at
    BEFORE UPDATE ON student_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 建立函數:自動更新任務狀態為 overdue
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

-- 建立註解
COMMENT ON TABLE student_tasks IS '學生任務表 - 記錄每堂課交代的作業';
COMMENT ON COLUMN student_tasks.task_type IS '任務類型: daily=每日任務, onetime=一次性任務';
COMMENT ON COLUMN student_tasks.daily_completion IS '每日完成記錄 JSON 陣列';
COMMENT ON COLUMN student_tasks.daily_streak IS '連續完成天數';
