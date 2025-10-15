import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/api-auth';

// GET - 取得單字學習記錄列表
export async function GET(request: NextRequest) {
  try {
    // 驗證 API 金鑰
    const authResult = await verifyApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
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

    // 查詢單字學習記錄
    let query = supabase
      .from('vocabulary_sessions')
      .select('*')
      .eq('student_id', student_id)
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('[Vocabulary Sessions API] Database error:', sessionsError);
      return NextResponse.json(
        { success: false, error: sessionsError.message },
        { status: 500 }
      );
    }

    // 轉換為前端需要的格式
    const vocabularySessions = sessions?.map((session: any) => ({
      id: session.id,
      date: session.session_date,
      wordsLearned: session.words_learned,
      unit: `Unit ${session.start_number}-${session.end_number}`,
      startNumber: session.start_number,
      endNumber: session.end_number,
      accuracy: session.accuracy_rate || 0,
      duration: session.session_duration || 0,
      reviewCount: session.review_count || 0,
      status: session.status,
      notes: session.notes,
      parentVerified: session.parent_verified,
      courseId: session.course_id,
      createdAt: session.created_at
    })) || [];

    // 計算統計資料
    const totalSessions = vocabularySessions.length;
    const totalWords = vocabularySessions.reduce((sum, s) => sum + s.wordsLearned, 0);
    const avgAccuracy = totalSessions > 0
      ? vocabularySessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions
      : 0;
    const totalDuration = vocabularySessions.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // 按狀態分組統計
    const byStatus: Record<string, number> = {};
    vocabularySessions.forEach(session => {
      const status = session.status || 'completed';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // 計算最佳/最差準確率
    const accuracies = vocabularySessions.map(s => s.accuracy).filter(a => a > 0);
    const bestAccuracy = accuracies.length > 0 ? Math.max(...accuracies) : 0;
    const worstAccuracy = accuracies.length > 0 ? Math.min(...accuracies) : 0;

    // 計算每週平均學習次數（最近4週）
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const recentSessions = vocabularySessions.filter(s =>
      new Date(s.date) >= fourWeeksAgo
    );
    const avgSessionsPerWeek = recentSessions.length / 4;

    const stats = {
      total_sessions: totalSessions,
      total_words_learned: totalWords,
      average_accuracy: Math.round(avgAccuracy * 10) / 10,
      best_accuracy: bestAccuracy,
      worst_accuracy: worstAccuracy,
      total_duration_minutes: totalDuration,
      average_duration_minutes: Math.round(avgDuration),
      sessions_per_week: Math.round(avgSessionsPerWeek * 10) / 10,
      by_status: byStatus,
      completed_sessions: byStatus['completed'] || 0,
      in_progress_sessions: byStatus['in_progress'] || 0
    };

    return NextResponse.json({
      success: true,
      data: vocabularySessions,
      stats: stats,
      metadata: {
        student_id: student_id,
        course_id: course_id,
        limit: limit,
        offset: offset,
        total_count: totalSessions
      }
    });

  } catch (error) {
    console.error('[Vocabulary Sessions API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
