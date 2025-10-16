-- 建立課程影片進度追蹤表
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id VARCHAR NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    "current_time" INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_lesson UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_lesson ON user_lesson_progress(user_id, lesson_id);

CREATE TRIGGER update_user_lesson_progress_updated_at
    BEFORE UPDATE ON user_lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE user_lesson_progress IS '用戶課程單元學習進度追蹤';
COMMENT ON COLUMN user_lesson_progress."current_time" IS '影片當前播放時間（秒數）';
COMMENT ON COLUMN user_lesson_progress.progress_percentage IS '學習進度百分比 (0-100)';
COMMENT ON COLUMN user_lesson_progress.completed IS '是否完成（進度達80%以上自動標記為完成）';
COMMENT ON COLUMN user_lesson_progress.last_watched_at IS '最後觀看時間';
