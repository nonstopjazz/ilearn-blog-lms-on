-- 正確修正外鍵約束：指向 course_lessons.course_id 而非 course_lessons.id
DO $$
BEGIN
    -- 移除現有的錯誤外鍵約束
    ALTER TABLE vocabulary_sessions DROP CONSTRAINT IF EXISTS vocabulary_sessions_course_id_fkey;
    ALTER TABLE exam_records DROP CONSTRAINT IF EXISTS exam_records_course_id_fkey;
    ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_course_id_fkey;

    RAISE NOTICE 'Dropped existing foreign key constraints';

    -- 確保 course_lessons.course_id 有唯一約束（外鍵目標必須是唯一的）
    ALTER TABLE course_lessons ADD CONSTRAINT course_lessons_course_id_unique UNIQUE (course_id)
    ON CONFLICT DO NOTHING;

    -- 添加正確的外鍵約束，指向 course_lessons.course_id
    ALTER TABLE vocabulary_sessions
    ADD CONSTRAINT vocabulary_sessions_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES course_lessons(course_id) ON DELETE CASCADE;

    ALTER TABLE exam_records
    ADD CONSTRAINT exam_records_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES course_lessons(course_id) ON DELETE CASCADE;

    RAISE NOTICE 'Added correct foreign key constraints pointing to course_lessons.course_id';

EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists, skipping';
    WHEN others THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        -- 如果外鍵約束添加失敗（可能是資料不一致），先移除約束讓系統可以運作
        ALTER TABLE vocabulary_sessions DROP CONSTRAINT IF EXISTS vocabulary_sessions_course_id_fkey;
        ALTER TABLE exam_records DROP CONSTRAINT IF EXISTS exam_records_course_id_fkey;
        RAISE NOTICE 'Foreign key constraints removed due to data inconsistency - manual cleanup needed';
END $$;