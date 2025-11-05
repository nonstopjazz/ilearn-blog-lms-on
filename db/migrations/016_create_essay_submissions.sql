-- 016_create_essay_submissions.sql
-- 作文提交系統資料表

-- 建立作文提交記錄表
CREATE TABLE IF NOT EXISTS essay_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id VARCHAR REFERENCES student_tasks(id) ON DELETE SET NULL,

  -- 檔案資訊
  image_url TEXT NOT NULL,                       -- Supabase Storage URL
  image_thumbnail_url TEXT,                      -- 縮圖 URL（可選）
  file_name VARCHAR(255) NOT NULL,
  original_file_size INTEGER,                    -- 原始大小（bytes）
  compressed_file_size INTEGER,                  -- 壓縮後大小（bytes）
  mime_type VARCHAR(50),
  image_width INTEGER,                           -- 圖片寬度
  image_height INTEGER,                          -- 圖片高度

  -- 作文資訊
  essay_title VARCHAR(255),                      -- 作文標題
  essay_date DATE DEFAULT CURRENT_DATE,          -- 提交日期
  essay_topic TEXT,                              -- 作文題目
  essay_topic_detail TEXT,                       -- 題目詳細說明

  -- 備註功能
  student_notes TEXT,                            -- 學生自己的備註
  teacher_comment TEXT,                          -- 老師評語
  overall_comment TEXT,                          -- 總體評語

  -- 評分 - 各項細分
  score_content INTEGER CHECK (score_content >= 0 AND score_content <= 100),      -- 內容完整性
  score_grammar INTEGER CHECK (score_grammar >= 0 AND score_grammar <= 100),      -- 文法正確性
  score_structure INTEGER CHECK (score_structure >= 0 AND score_structure <= 100), -- 結構組織
  score_vocabulary INTEGER CHECK (score_vocabulary >= 0 AND score_vocabulary <= 100), -- 用詞精確度
  score_creativity INTEGER CHECK (score_creativity >= 0 AND score_creativity <= 100), -- 創意表達

  -- 總分計算（自動計算或手動輸入）
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 100),
  grade_level VARCHAR(10),                       -- 評級（A+, A, B+, etc.）

  -- 標記和分析
  annotations JSONB DEFAULT '[]'::jsonb,         -- 標記陣列 [{id, text, start, end, feedback}]
  highlights JSONB DEFAULT '[]'::jsonb,          -- 高亮片段

  -- 狀態
  status VARCHAR(20) DEFAULT 'submitted'         -- submitted, grading, graded, revised
    CHECK (status IN ('submitted', 'grading', 'graded', 'revised', 'draft')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),

  -- 標籤（方便分類）
  tags TEXT[],                                   -- ['作文', '日記', '讀書心得']

  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_essay_student_date ON essay_submissions(student_id, essay_date DESC);
CREATE INDEX IF NOT EXISTS idx_essay_task ON essay_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_essay_status ON essay_submissions(status);
CREATE INDEX IF NOT EXISTS idx_essay_tags ON essay_submissions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_essay_created ON essay_submissions(created_at DESC);

-- 自動更新 updated_at
CREATE TRIGGER update_essay_submissions_updated_at
  BEFORE UPDATE ON essay_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 自動計算總分的函數（平均五項評分）
CREATE OR REPLACE FUNCTION calculate_total_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score_content IS NOT NULL
     AND NEW.score_grammar IS NOT NULL
     AND NEW.score_structure IS NOT NULL
     AND NEW.score_vocabulary IS NOT NULL
     AND NEW.score_creativity IS NOT NULL THEN
    NEW.total_score := ROUND(
      (NEW.score_content + NEW.score_grammar + NEW.score_structure +
       NEW.score_vocabulary + NEW.score_creativity) / 5.0
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 觸發器：自動計算總分
CREATE TRIGGER auto_calculate_total_score
  BEFORE INSERT OR UPDATE ON essay_submissions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_score();

-- 啟用 RLS
ALTER TABLE essay_submissions ENABLE ROW LEVEL SECURITY;

-- RLS 政策：學生可以查看和新增自己的作文
CREATE POLICY "Students can view own essays"
  ON essay_submissions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own essays"
  ON essay_submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own essays"
  ON essay_submissions FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- RLS 政策：管理員可以查看和編輯所有作文
CREATE POLICY "Admins can view all essays"
  ON essay_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all essays"
  ON essay_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete essays"
  ON essay_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 註解
COMMENT ON TABLE essay_submissions IS '學生作文提交記錄';
COMMENT ON COLUMN essay_submissions.student_notes IS '學生自己的備註說明';
COMMENT ON COLUMN essay_submissions.teacher_comment IS '老師的評語和建議';
COMMENT ON COLUMN essay_submissions.overall_comment IS '總體評語';
COMMENT ON COLUMN essay_submissions.annotations IS '標記陣列，格式：[{id, text, start, end, feedback}]';
COMMENT ON COLUMN essay_submissions.tags IS '分類標籤，例如：作文、日記、讀書心得';
COMMENT ON COLUMN essay_submissions.score_content IS '內容完整性評分 (0-100)';
COMMENT ON COLUMN essay_submissions.score_grammar IS '文法正確性評分 (0-100)';
COMMENT ON COLUMN essay_submissions.score_structure IS '結構組織評分 (0-100)';
COMMENT ON COLUMN essay_submissions.score_vocabulary IS '用詞精確度評分 (0-100)';
COMMENT ON COLUMN essay_submissions.score_creativity IS '創意表達評分 (0-100)';
COMMENT ON COLUMN essay_submissions.total_score IS '總分（自動計算為五項平均）';
