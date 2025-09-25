-- 強制移除所有相關的外鍵約束
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- 查找並移除所有 vocabulary_sessions 表的外鍵約束
    FOR constraint_record IN
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE table_name = 'vocabulary_sessions'
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;

    -- 確保 vocabulary_sessions 表存在並且沒有外鍵約束
    DROP TABLE IF EXISTS vocabulary_sessions CASCADE;

    -- 重新創建表，確保沒有外鍵約束
    CREATE TABLE vocabulary_sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        student_id UUID NOT NULL,
        course_id VARCHAR NOT NULL,  -- 字串ID，不是外鍵
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

    -- 創建索引
    CREATE INDEX IF NOT EXISTS idx_vocabulary_sessions_student_id ON vocabulary_sessions(student_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_sessions_course_id ON vocabulary_sessions(course_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_sessions_date ON vocabulary_sessions(session_date);

    RAISE NOTICE 'vocabulary_sessions table recreated successfully without foreign key constraints';
END $$;