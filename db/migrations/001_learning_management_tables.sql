-- 擴展現有的 assignments 表
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS week_number INTEGER,
ADD COLUMN IF NOT EXISTS daily_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS submission_type VARCHAR(50) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS is_daily BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS repeat_schedule JSONB,
ADD COLUMN IF NOT EXISTS parent_notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requirements JSONB;

-- 建立每日作業類型表
CREATE TABLE IF NOT EXISTS daily_assignment_types (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    submission_type VARCHAR(50) DEFAULT 'text', -- text, photo, file, quiz
    default_points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立單字學習追蹤表
CREATE TABLE IF NOT EXISTS vocabulary_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    course_id VARCHAR NOT NULL,
    session_date DATE NOT NULL,
    start_number INTEGER NOT NULL, -- 累積編號起始
    end_number INTEGER NOT NULL,   -- 累積編號結束
    words_learned INTEGER GENERATED ALWAYS AS (end_number - start_number + 1) STORED,
    session_duration INTEGER, -- 學習時長（分鐘）
    accuracy_rate DECIMAL(5,2), -- 正確率
    review_count INTEGER DEFAULT 0, -- 複習次數
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- completed, in_progress, skipped
    parent_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (course_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    CONSTRAINT unique_student_date UNIQUE(student_id, course_id, session_date)
);

-- 建立考試成績管理表
CREATE TABLE IF NOT EXISTS exam_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    course_id VARCHAR NOT NULL,
    exam_type VARCHAR(50) NOT NULL, -- quiz, midterm, final, placement
    exam_name VARCHAR(200) NOT NULL,
    exam_date DATE NOT NULL,
    subject VARCHAR(100),
    total_score DECIMAL(5,2),
    max_score DECIMAL(5,2) DEFAULT 100,
    percentage_score DECIMAL(5,2) GENERATED ALWAYS AS
        (CASE WHEN max_score > 0 THEN (total_score / max_score * 100) ELSE 0 END) STORED,
    grade VARCHAR(10), -- A+, A, B+, B, etc.
    class_rank INTEGER,
    class_size INTEGER,
    topics JSONB, -- 考試範圍/主題
    mistakes JSONB, -- 錯誤記錄 [{question: "", correct_answer: "", student_answer: ""}]
    teacher_feedback TEXT,
    improvement_areas TEXT[],
    is_retake BOOLEAN DEFAULT FALSE,
    original_exam_id VARCHAR, -- 如果是補考，記錄原始考試ID
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (course_id) REFERENCES course_lessons(id) ON DELETE CASCADE
);

-- 建立特殊專案管理表
CREATE TABLE IF NOT EXISTS special_projects (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    course_id VARCHAR,
    project_type VARCHAR(50) NOT NULL, -- english_cert, competition, research, presentation
    project_name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    target_date DATE,
    completion_date DATE,
    status VARCHAR(20) DEFAULT 'planning', -- planning, in_progress, completed, paused, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    milestones JSONB, -- [{title: "", target_date: "", completed: false}]
    resources JSONB, -- 所需資源
    progress_percentage INTEGER DEFAULT 0,
    outcomes TEXT,
    reflection TEXT,
    mentor_notes TEXT,
    attachments TEXT[],
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立作業提交記錄表
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assignment_id VARCHAR NOT NULL,
    student_id UUID NOT NULL,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    submission_type VARCHAR(50), -- text, photo, file, link
    content TEXT,
    file_url TEXT,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, returned, resubmit
    graded_by UUID,
    graded_at TIMESTAMPTZ,
    is_late BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- 建立學習進度統計表
CREATE TABLE IF NOT EXISTS learning_progress_stats (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    course_id VARCHAR NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    assignments_completed INTEGER DEFAULT 0,
    assignments_total INTEGER DEFAULT 0,
    vocabulary_words_learned INTEGER DEFAULT 0,
    vocabulary_accuracy DECIMAL(5,2),
    quiz_average DECIMAL(5,2),
    attendance_rate DECIMAL(5,2),
    study_time_minutes INTEGER DEFAULT 0,
    parent_feedback TEXT,
    teacher_notes TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (course_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    CONSTRAINT unique_student_week UNIQUE(student_id, course_id, week_number, year)
);

-- 建立家長通知記錄表
CREATE TABLE IF NOT EXISTS parent_notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- weekly_report, assignment_reminder, exam_result, achievement
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    data JSONB, -- 相關數據
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    sent_via VARCHAR(20)[], -- email, sms, in_app
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_vocabulary_student_date ON vocabulary_sessions(student_id, session_date);
CREATE INDEX IF NOT EXISTS idx_exam_student_date ON exam_records(student_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_special_projects_student ON special_projects(student_id, status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id, submission_date);
CREATE INDEX IF NOT EXISTS idx_learning_progress_student_week ON learning_progress_stats(student_id, week_number, year);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student ON parent_notifications(student_id, is_read);

-- 插入預設的每日作業類型
INSERT INTO daily_assignment_types (name, display_name, description, icon, submission_type, default_points, order_index) VALUES
('vocabulary', '背單字', '每日單字學習與複習', '📚', 'text', 10, 1),
('photo_submit', '拍照回傳', '完成指定作業並拍照上傳', '📸', 'photo', 10, 2),
('reading', '閱讀理解', '完成指定閱讀材料', '📖', 'text', 15, 3),
('listening', '聽力練習', '完成聽力訓練', '🎧', 'text', 15, 4),
('writing', '寫作練習', '完成寫作任務', '✍️', 'text', 20, 5),
('speaking', '口說練習', '錄音或視訊練習', '🗣️', 'file', 20, 6),
('quiz', '每日測驗', '完成線上測驗', '📝', 'quiz', 15, 7),
('review', '複習作業', '複習本週所學內容', '🔄', 'text', 10, 8)
ON CONFLICT (id) DO NOTHING;

-- 建立觸發器自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為所有新表建立更新觸發器
CREATE TRIGGER update_daily_assignment_types_updated_at BEFORE UPDATE ON daily_assignment_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vocabulary_sessions_updated_at BEFORE UPDATE ON vocabulary_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_exam_records_updated_at BEFORE UPDATE ON exam_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_special_projects_updated_at BEFORE UPDATE ON special_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();