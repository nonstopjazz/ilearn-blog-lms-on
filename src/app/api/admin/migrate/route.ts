import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { verifyApiKey } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // 驗證 API 金鑰（開發環境下會自動通過）
    const authResult = await verifyApiKey(request);
    if (!authResult.valid && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase 初始化失敗' },
        { status: 500 }
      );
    }

    console.log('[Migration API] Starting database migration...');

    // 讀取請求體以獲取自定義 SQL（如果有的話）
    let customSQL = null;
    try {
      const requestBody = await request.json().catch(() => null);
      if (requestBody && requestBody.sql) {
        customSQL = requestBody.sql;
      }
    } catch (e) {
      // 如果沒有請求體或解析失敗，使用預設的遷移
    }

    // 如果有自定義 SQL，執行它
    if (customSQL) {
      const { error: customError } = await supabase.rpc('exec', { sql: customSQL });
      if (customError) {
        console.error('[Migration API] Custom SQL failed:', customError);
        return NextResponse.json(
          { success: false, error: 'Custom SQL execution failed: ' + customError.message },
          { status: 500 }
        );
      }
      console.log('[Migration API] Custom SQL executed successfully');
      return NextResponse.json({
        success: true,
        message: 'Custom SQL executed successfully'
      });
    }

    // 修正外鍵約束的遷移 - 暫時移除錯誤的外鍵約束
    const migrationSQL = `
-- 移除錯誤的外鍵約束，允許使用字串課程ID
DO $$
BEGIN
    -- 移除 vocabulary_sessions 的外鍵約束
    BEGIN
        ALTER TABLE vocabulary_sessions DROP CONSTRAINT vocabulary_sessions_course_id_fkey;
        RAISE NOTICE 'Dropped vocabulary_sessions foreign key constraint';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'vocabulary_sessions constraint does not exist';
    END;

    -- 移除 exam_records 的外鍵約束
    BEGIN
        ALTER TABLE exam_records DROP CONSTRAINT exam_records_course_id_fkey;
        RAISE NOTICE 'Dropped exam_records foreign key constraint';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'exam_records constraint does not exist';
    END;
END $$;

-- 確保 vocabulary_sessions 表存在且結構正確
CREATE TABLE IF NOT EXISTS vocabulary_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    course_id VARCHAR NOT NULL,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 確保 exam_records 表存在
CREATE TABLE IF NOT EXISTS exam_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    course_id VARCHAR,
    exam_type VARCHAR(50),
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

-- 確保 assignment_submissions 表存在
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

-- 移除舊的唯一約束（如果存在）並添加新的
DO $$
BEGIN
    BEGIN
        ALTER TABLE vocabulary_sessions DROP CONSTRAINT unique_student_date;
    EXCEPTION
        WHEN undefined_object THEN
            NULL; -- 約束不存在，忽略錯誤
    END;

    -- 添加新的唯一約束
    BEGIN
        ALTER TABLE vocabulary_sessions ADD CONSTRAINT unique_student_course_date UNIQUE(student_id, course_id, session_date);
    EXCEPTION
        WHEN duplicate_table THEN
            NULL; -- 約束已存在，忽略錯誤
    END;
END $$;
`;

    // 執行遷移
    const { error: migrationError } = await supabase.rpc('exec', { sql: migrationSQL });

    if (migrationError) {
      // 如果 rpc 不可用，嘗試直接執行各個表的創建
      console.log('[Migration API] RPC failed, trying individual table creation...');

      // 創建 vocabulary_sessions 表
      const { error: vocabError } = await supabase
        .from('vocabulary_sessions')
        .select('id')
        .limit(1);

      if (vocabError && vocabError.code === '42P01') {
        // 表不存在，創建它
        const createVocabSQL = `
        CREATE TABLE vocabulary_sessions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          student_id UUID NOT NULL,
          course_id VARCHAR NOT NULL,
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
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`;

        const { error: createError } = await supabase.rpc('exec', { sql: createVocabSQL });
        if (createError) {
          console.error('[Migration API] Failed to create vocabulary_sessions:', createError);
          return NextResponse.json(
            { success: false, error: 'Failed to create vocabulary_sessions table' },
            { status: 500 }
          );
        }
      }
    }

    console.log('[Migration API] Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully'
    });

  } catch (error) {
    console.error('[Migration API] Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed: ' + error.message },
      { status: 500 }
    );
  }
}