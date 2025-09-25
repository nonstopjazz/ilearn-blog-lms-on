import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/api-auth';
import type { LearningProgressStats, LearningSummary, ApiResponse } from '@/types/learning-management';

// 取得當前週數
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// GET - 取得學習進度統計
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

    const student_id = searchParams.get('student_id');
    const course_id = searchParams.get('course_id');
    const week_number = searchParams.get('week_number');
    const year = searchParams.get('year');
    const summary = searchParams.get('summary') === 'true';

    // 如果請求摘要資料
    if (summary && student_id) {
      const startDate = searchParams.get('start_date') ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = searchParams.get('end_date') ||
        new Date().toISOString().split('T')[0];

      // 取得各種統計資料
      const [
        assignments,
        vocabulary,
        exams,
        projects,
        submissions
      ] = await Promise.all([
        // 作業統計
        supabase
          .from('assignments')
          .select('id')
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .eq('is_published', true),

        // 單字學習統計
        supabase
          .from('vocabulary_sessions')
          .select('words_learned, accuracy_rate, session_duration')
          .eq('student_id', student_id)
          .gte('session_date', startDate)
          .lte('session_date', endDate),

        // 考試統計
        supabase
          .from('exam_records')
          .select('percentage_score')
          .eq('student_id', student_id)
          .gte('exam_date', startDate)
          .lte('exam_date', endDate),

        // 專案統計
        supabase
          .from('special_projects')
          .select('status')
          .eq('student_id', student_id),

        // 作業提交統計
        supabase
          .from('assignment_submissions')
          .select('assignment_id, is_late, created_at')
          .eq('student_id', student_id)
          .gte('submission_date', startDate)
          .lte('submission_date', endDate)
      ]);

      // 計算統計摘要
      const learniSummary: LearningSummary = {
        student_id: student_id,
        period: {
          start: startDate,
          end: endDate
        },
        assignments: {
          total: assignments.data?.length || 0,
          completed: submissions.data?.length || 0,
          on_time: submissions.data?.filter(s => !s.is_late).length || 0,
          late: submissions.data?.filter(s => s.is_late).length || 0
        },
        vocabulary: {
          total_words: vocabulary.data?.reduce((sum, v) => sum + (v.words_learned || 0), 0) || 0,
          avg_accuracy: vocabulary.data && vocabulary.data.length > 0
            ? vocabulary.data.reduce((sum, v) => sum + (v.accuracy_rate || 0), 0) / vocabulary.data.length
            : 0,
          sessions_count: vocabulary.data?.length || 0
        },
        exams: {
          count: exams.data?.length || 0,
          avg_score: exams.data && exams.data.length > 0
            ? exams.data.reduce((sum, e) => sum + (e.percentage_score || 0), 0) / exams.data.length
            : 0,
          highest_score: exams.data && exams.data.length > 0
            ? Math.max(...exams.data.map(e => e.percentage_score || 0))
            : 0,
          lowest_score: exams.data && exams.data.length > 0
            ? Math.min(...exams.data.map(e => e.percentage_score || 0))
            : 0
        },
        projects: {
          total: projects.data?.length || 0,
          active: projects.data?.filter(p => p.status === 'in_progress').length || 0,
          completed: projects.data?.filter(p => p.status === 'completed').length || 0
        },
        study_time: {
          total_minutes: vocabulary.data?.reduce((sum, v) => sum + (v.session_duration || 0), 0) || 0,
          daily_average: 0 // 將在下面計算
        }
      };

      // 計算每日平均學習時間
      const days = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      learniSummary.study_time.daily_average =
        days > 0 ? Math.round(learniSummary.study_time.total_minutes / days) : 0;

      return NextResponse.json({
        success: true,
        data: learniSummary
      } as ApiResponse<LearningSummary>);
    }

    // 否則返回週進度記錄
    let query = supabase
      .from('learning_progress_stats')
      .select('*')
      .order('week_number', { ascending: false });

    if (student_id) {
      query = query.eq('student_id', student_id);
    }
    if (course_id) {
      query = query.eq('course_id', course_id);
    }
    if (week_number) {
      query = query.eq('week_number', week_number);
    }
    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Progress API] Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    } as ApiResponse<LearningProgressStats[]>);

  } catch (error) {
    console.error('[Progress API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 生成週進度報告
export async function POST(request: NextRequest) {
  try {
    // 驗證 API 金鑰
    const authResult = await verifyApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = getSupabase();

    // 驗證必填欄位
    if (!body.student_id || !body.course_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const now = new Date();
    const week_number = body.week_number || getWeekNumber(now);
    const year = body.year || now.getFullYear();

    // 計算週的開始和結束日期
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week_number - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + daysToAdd * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);

    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];

    // 收集週統計資料
    const [
      assignments,
      submissions,
      vocabulary,
      exams
    ] = await Promise.all([
      // 本週作業
      supabase
        .from('assignments')
        .select('id')
        .eq('course_id', body.course_id)
        .gte('due_date', startDate)
        .lte('due_date', endDate),

      // 已提交作業
      supabase
        .from('assignment_submissions')
        .select('assignment_id')
        .eq('student_id', body.student_id)
        .gte('submission_date', startDate)
        .lte('submission_date', endDate),

      // 單字學習
      supabase
        .from('vocabulary_sessions')
        .select('words_learned, accuracy_rate, session_duration')
        .eq('student_id', body.student_id)
        .eq('course_id', body.course_id)
        .gte('session_date', startDate)
        .lte('session_date', endDate),

      // 考試成績
      supabase
        .from('exam_records')
        .select('percentage_score')
        .eq('student_id', body.student_id)
        .eq('course_id', body.course_id)
        .gte('exam_date', startDate)
        .lte('exam_date', endDate)
    ]);

    // 計算統計數據
    const stats = {
      student_id: body.student_id,
      course_id: body.course_id,
      week_number: week_number,
      year: year,
      assignments_total: assignments.data?.length || 0,
      assignments_completed: submissions.data?.length || 0,
      vocabulary_words_learned: vocabulary.data?.reduce((sum, v) => sum + (v.words_learned || 0), 0) || 0,
      vocabulary_accuracy: vocabulary.data && vocabulary.data.length > 0
        ? vocabulary.data.reduce((sum, v) => sum + (v.accuracy_rate || 0), 0) / vocabulary.data.length
        : null,
      quiz_average: exams.data && exams.data.length > 0
        ? exams.data.reduce((sum, e) => sum + (e.percentage_score || 0), 0) / exams.data.length
        : null,
      study_time_minutes: vocabulary.data?.reduce((sum, v) => sum + (v.session_duration || 0), 0) || 0,
      parent_feedback: body.parent_feedback,
      teacher_notes: body.teacher_notes
    };

    // 檢查是否已存在
    const { data: existing } = await supabase
      .from('learning_progress_stats')
      .select('id')
      .eq('student_id', body.student_id)
      .eq('course_id', body.course_id)
      .eq('week_number', week_number)
      .eq('year', year)
      .single();

    let result;
    if (existing) {
      // 更新現有記錄
      const { data, error } = await supabase
        .from('learning_progress_stats')
        .update(stats)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 新增記錄
      const { data, error } = await supabase
        .from('learning_progress_stats')
        .insert([stats])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // 如果需要，生成家長通知
    if (body.generate_notification) {
      const notification = {
        student_id: body.student_id,
        notification_type: 'weekly_report',
        subject: `第${week_number}週學習報告`,
        content: `
本週學習摘要：
- 完成作業：${stats.assignments_completed}/${stats.assignments_total}
- 學習單字：${stats.vocabulary_words_learned}個
- 單字正確率：${stats.vocabulary_accuracy?.toFixed(1) || 'N/A'}%
- 測驗平均分：${stats.quiz_average?.toFixed(1) || 'N/A'}分
- 學習時間：${stats.study_time_minutes}分鐘
        `.trim(),
        data: stats,
        sent_via: ['in_app'],
        status: 'pending'
      };

      await supabase
        .from('parent_notifications')
        .insert([notification]);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Weekly progress report generated successfully'
    } as ApiResponse<LearningProgressStats>);

  } catch (error) {
    console.error('[Progress API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}