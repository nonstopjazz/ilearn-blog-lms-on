import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { verifyApiKey } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyApiKey(request);
    if (!authResult.valid && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 查詢外鍵約束資訊
    const constraintQuery = `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('vocabulary_sessions', 'exam_records', 'assignment_submissions')
      ORDER BY tc.table_name, tc.constraint_name;
    `;

    // 查詢 course_lessons 表的欄位
    const courseColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'course_lessons'
      ORDER BY ordinal_position;
    `;

    // 查詢現有的 course_lessons 記錄
    const { data: courseLessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('id, course_id, title')
      .limit(10);

    if (lessonsError) {
      console.error('[Check Constraints API] Error fetching course_lessons:', lessonsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: '請在 Supabase Dashboard 的 SQL Editor 中執行以下查詢來查看約束：',
        constraintQuery,
        courseColumnsQuery,
        sampleCourseData: courseLessons || [],
        instructions: [
          '1. 登入 Supabase Dashboard',
          '2. 進入 SQL Editor',
          '3. 複製並執行上方的 constraintQuery',
          '4. 查看外鍵約束指向的欄位',
          '5. 如果指向 course_lessons(id) 而非 course_lessons(course_id)，需要修正'
        ]
      }
    });

  } catch (error) {
    console.error('[Check Constraints API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}