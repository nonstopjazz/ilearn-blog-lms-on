-- 修正學習管理表格的外鍵約束問題
-- 移除不正確的外鍵約束，因為我們的 course_id 是字串，不對應 course_lessons.id

-- 如果 vocabulary_sessions 表存在外鍵約束，先移除
DO $$
BEGIN
    -- 嘗試移除外鍵約束（如果存在）
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%vocabulary_sessions%course%'
        AND table_name = 'vocabulary_sessions'
    ) THEN
        ALTER TABLE vocabulary_sessions
        DROP CONSTRAINT IF EXISTS vocabulary_sessions_course_id_fkey;
    END IF;
END $$;

-- 確保表格存在並且結構正確
CREATE TABLE IF NOT EXISTS vocabulary_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    course_id VARCHAR NOT NULL,  -- 這是字串ID，不是外鍵
    session_date DATE NOT NULL,
    start_number INTEGER NOT NULL,
    end_number INTEGER NOT NULL,
    words_learned INTEGER GENERATED ALWAYS AS (end_number - start_number + 1) STORED,
    session_duration INTEGER,
    accuracy_rate DECIMAL(5,2),
    review_count INTEGER DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    parent_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_course_date UNIQUE(student_id, course_id, session_date)
);

-- 確保 exam_records 表也存在
CREATE TABLE IF NOT EXISTS exam_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    course_id VARCHAR,  -- 可選的課程ID
    exam_type VARCHAR(50),  -- quiz, midterm, final, etc.
    exam_name VARCHAR(200) NOT NULL,
    exam_date DATE NOT NULL,
    total_score DECIMAL(10,2) NOT NULL,
    max_score DECIMAL(10,2) DEFAULT 100,
    percentage_score DECIMAL(5,2) GENERATED ALWAYS AS ((total_score / NULLIF(max_score, 0)) * 100) STORED,
    subject VARCHAR(100),
    teacher_feedback TEXT,
    parent_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 確保 assignment_submissions 表也存在
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assignment_id VARCHAR NOT NULL,
    student_id UUID NOT NULL,
    submission_type VARCHAR(50) DEFAULT 'text',
    content TEXT,
    file_url VARCHAR(500),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    score DECIMAL(10,2),
    max_score DECIMAL(10,2) DEFAULT 100,
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    graded_by UUID,
    status VARCHAR(20) DEFAULT 'submitted',
    parent_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_vocabulary_sessions_student_id ON vocabulary_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sessions_course_id ON vocabulary_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sessions_date ON vocabulary_sessions(session_date);

CREATE INDEX IF NOT EXISTS idx_exam_records_student_id ON exam_records(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_records_date ON exam_records(exam_date);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);