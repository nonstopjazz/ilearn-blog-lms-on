-- ===================================================
-- 修復腳本：建立所有缺失的資料表
-- ===================================================
-- 使用方式：
-- 1. 登入 Supabase Dashboard (https://supabase.com/dashboard)
-- 2. 選擇您的專案
-- 3. 進入 SQL Editor
-- 4. 貼上並執行此腳本
-- ===================================================

-- ===========================
-- 0. 前置函數
-- ===========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 1. 建立 assignments 表
-- ===========================
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    course_id VARCHAR,
    lesson_id VARCHAR,
    due_date DATE,
    assignment_type VARCHAR(50) DEFAULT 'task',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'medium', 'high', 'urgent')),
    submission_type VARCHAR(50) DEFAULT 'text',
    max_score INTEGER DEFAULT 100,
    estimated_duration INTEGER,
    is_required BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    instructions TEXT,
    tags TEXT[] DEFAULT '{}',
    resources JSONB DEFAULT '[]',
    -- 來自 migration 001 的額外欄位
    week_number INTEGER,
    daily_type VARCHAR(50),
    is_daily BOOLEAN DEFAULT FALSE,
    repeat_schedule JSONB,
    parent_notification_sent BOOLEAN DEFAULT FALSE,
    requirements JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_published ON assignments(is_published);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================
-- 2. 建立 assignment_submissions 表
-- ===========================
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assignment_id VARCHAR NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    submission_type VARCHAR(50),
    content TEXT,
    file_url TEXT,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'submitted',
    graded_by UUID,
    graded_at TIMESTAMPTZ,
    is_late BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id, submission_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);

DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================
-- 3. 建立 student_tasks 表
-- ===========================
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

    -- 可見性控制欄位（來自 migration 014）
    visible_to_student BOOLEAN DEFAULT FALSE,
    graded_at TIMESTAMPTZ,
    graded_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_tasks_student_date ON student_tasks(student_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON student_tasks(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_tasks_type ON student_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_student_tasks_due_date ON student_tasks(due_date) WHERE status != 'completed';

DROP TRIGGER IF EXISTS update_student_tasks_updated_at ON student_tasks;
CREATE TRIGGER update_student_tasks_updated_at
    BEFORE UPDATE ON student_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 自動更新逾期任務的函數
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

COMMENT ON TABLE student_tasks IS '學生任務表 - 記錄每堂課交代的作業';

-- ===========================
-- 4. 建立 exam_types 表
-- ===========================
CREATE TABLE IF NOT EXISTS exam_types (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(50) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入預設考試類型
INSERT INTO exam_types (name, display_name, description, color, icon, is_active, order_index) VALUES
('quiz', '小考', '週間小型測驗', 'rgb(59, 130, 246)', '📝', true, 1),
('class_test', '隨堂考', '課堂即時測驗', 'rgb(168, 85, 247)', '✏️', true, 2),
('vocabulary_test', '單字測驗', '單字背誦測驗', 'rgb(34, 197, 94)', '📚', true, 3),
('speaking_eval', '口說評量', '口語能力評估', 'rgb(251, 146, 60)', '🗣️', true, 4),
('midterm', '段考', '期中/期末段考', 'rgb(239, 68, 68)', '📋', true, 5),
('mock_exam', '模擬考', '模擬正式考試', 'rgb(124, 58, 237)', '🎓', true, 6),
('makeup', '補考', '補考測驗', 'rgb(107, 114, 128)', '🔄', true, 7),
('listening_test', '聽力測驗', '聽力能力測驗', 'rgb(14, 165, 233)', '🎧', false, 8),
('writing_test', '寫作測驗', '寫作能力測驗', 'rgb(236, 72, 153)', '✍️', false, 9)
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_exam_types_active ON exam_types(is_active, order_index);

DROP TRIGGER IF EXISTS update_exam_types_updated_at ON exam_types;
CREATE TRIGGER update_exam_types_updated_at BEFORE UPDATE ON exam_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================
-- 5. 驗證結果
-- ===========================
SELECT '建立完成' as status, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('assignments', 'assignment_submissions', 'student_tasks', 'exam_types')
ORDER BY tablename;
