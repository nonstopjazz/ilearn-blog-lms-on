import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/api-auth';

// GET - 取得考試成績列表
export async function GET(request: NextRequest) {
  try {
    // 驗證 API 金鑰（僅在配置了 API_KEY 時檢查）
    if (process.env.API_KEY) {
      const authResult = await verifyApiKey(request);
      if (!authResult.valid) {
        return NextResponse.json(
          { success: false, error: authResult.error },
          { status: 401 }
        );
      }
    } else {
      console.warn('[Exams List API] API_KEY not configured, skipping API key verification');
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    // 取得查詢參數
    const student_id = searchParams.get('student_id');
    const course_id = searchParams.get('course_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 驗證必填參數
    if (!student_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: student_id' },
        { status: 400 }
      );
    }

    // 查詢考試記錄
    let query = supabase
      .from('exam_records')
      .select('*')
      .eq('student_id', student_id)
      .order('exam_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    const { data: examRecords, error: examError } = await query;

    if (examError) {
      console.error('[Exams List API] Database error:', examError);
      return NextResponse.json(
        { success: false, error: examError.message },
        { status: 500 }
      );
    }

    // 轉換為前端需要的格式
    const exams = examRecords?.map((record: any) => ({
      id: record.id,
      name: record.exam_name || `${record.exam_type} - ${record.exam_date}`,
      type: record.exam_type,
      date: record.exam_date,
      score: record.total_score,
      maxScore: record.max_score || 100,
      subject: record.subject || '英語',
      percentage: record.percentage_score,
      courseId: record.course_id,
      createdAt: record.created_at
    })) || [];

    // 計算統計資料
    const totalExams = exams.length;
    const avgScore = totalExams > 0
      ? exams.reduce((sum, exam) => sum + exam.percentage, 0) / totalExams
      : 0;
    const maxScore = totalExams > 0
      ? Math.max(...exams.map(exam => exam.percentage))
      : 0;
    const minScore = totalExams > 0
      ? Math.min(...exams.map(exam => exam.percentage))
      : 0;

    // 按考試類型分組統計
    const byType: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
    exams.forEach(exam => {
      if (!byType[exam.type]) {
        byType[exam.type] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      byType[exam.type].count++;
      byType[exam.type].totalScore += exam.percentage;
    });

    // 計算每個類型的平均分
    Object.keys(byType).forEach(type => {
      byType[type].avgScore = Math.round(byType[type].totalScore / byType[type].count * 10) / 10;
    });

    const stats = {
      total_exams: totalExams,
      average_score: Math.round(avgScore * 10) / 10,
      highest_score: maxScore,
      lowest_score: minScore,
      by_type: byType
    };

    return NextResponse.json({
      success: true,
      data: exams,
      stats: stats,
      metadata: {
        student_id: student_id,
        course_id: course_id,
        limit: limit,
        offset: offset,
        total_count: totalExams
      }
    });

  } catch (error) {
    console.error('[Exams List API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
