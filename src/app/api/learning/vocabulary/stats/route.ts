import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAuthUserFromCookies } from '@/lib/api-auth';
import { isAdmin } from '@/lib/security-config';

// 工具函數：計算週次
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// 工具函數：取得週的日期範圍
function getWeekDateRange(year: number, weekNumber: number) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysToAdd = (weekNumber - 1) * 7;
  const weekStart = new Date(firstDayOfYear.getTime() + daysToAdd * 86400000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);

  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
    label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
  };
}

// 工具函數：根據 range 計算日期範圍
function getDateRangeFromRange(range: string, currentYear: number = new Date().getFullYear()) {
  const now = new Date();
  const currentWeek = getWeekNumber(now);

  let startWeek: number;
  let endWeek: number;

  switch (range) {
    case 'week':
      startWeek = Math.max(1, currentWeek - 1);
      endWeek = currentWeek;
      break;
    case 'month':
      startWeek = Math.max(1, currentWeek - 3);
      endWeek = currentWeek;
      break;
    case 'quarter':
      startWeek = Math.max(1, currentWeek - 11);
      endWeek = currentWeek;
      break;
    case 'semester':
      startWeek = Math.max(1, currentWeek - 17);
      endWeek = currentWeek;
      break;
    case 'all':
      startWeek = 1;
      endWeek = 52;
      break;
    default:
      startWeek = Math.max(1, currentWeek - 3);
      endWeek = currentWeek;
  }

  const startDate = getWeekDateRange(currentYear, startWeek);
  const endDate = getWeekDateRange(currentYear, endWeek);

  return {
    startDate: startDate.start,
    endDate: endDate.end,
    startWeek,
    endWeek
  };
}

// GET - 取得單字學習統計數據
export async function GET(request: NextRequest) {
  try {
    // Cookie 認證
    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    // 取得查詢參數
    const student_id = searchParams.get('student_id');
    // IDOR 防護：只允許查看自己的資料，除非是管理員
    const effectiveStudentId = student_id && student_id !== authUser.id && isAdmin(authUser)
      ? student_id
      : authUser.id;
    const course_id = searchParams.get('course_id');
    const range = searchParams.get('range') || 'month';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // 計算日期範圍
    const { startDate, endDate } = getDateRangeFromRange(range, year);

    // 查詢單字學習記錄
    let query = supabase
      .from('vocabulary_sessions')
      .select('*')
      .eq('student_id', effectiveStudentId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .eq('status', 'completed')
      .order('session_date', { ascending: true });

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('[Vocabulary Stats API] Database error:', sessionsError);
      return NextResponse.json(
        { success: false, error: sessionsError.message },
        { status: 500 }
      );
    }

    // 按週分組並計算統計
    const weeklyStats: Record<string, any> = {};

    sessions?.forEach((session) => {
      const sessionDate = new Date(session.session_date);
      const weekNumber = getWeekNumber(sessionDate);
      const sessionYear = sessionDate.getFullYear();
      const weekKey = `${sessionYear}-W${weekNumber}`;

      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = {
          week_number: weekNumber,
          year: sessionYear,
          total_words_learned: 0,
          total_accuracy: 0,
          session_count: 0,
          total_duration: 0
        };
      }

      weeklyStats[weekKey].total_words_learned += session.words_learned || 0;
      weeklyStats[weekKey].total_accuracy += session.accuracy_rate || 0;
      weeklyStats[weekKey].session_count++;
      weeklyStats[weekKey].total_duration += session.session_duration || 0;
    });

    // 轉換為前端需要的格式
    const data = Object.values(weeklyStats).map((week: any) => {
      const dateRange = getWeekDateRange(week.year, week.week_number);
      const avgAccuracy = week.session_count > 0 ? week.total_accuracy / week.session_count : 0;
      const totalWords = week.total_words_learned;
      const correctWords = Math.round(totalWords * avgAccuracy / 100);
      const incorrectWords = totalWords - correctWords;

      return {
        week_number: week.week_number,
        week_label: `第${week.week_number}週`,
        name: `第${week.week_number}週`,  // 前端 recharts 需要的欄位
        year: week.year,
        week_start_date: dateRange.start,
        week_end_date: dateRange.end,
        month: new Date(dateRange.start).getMonth() + 1,
        已教單字: totalWords,
        答對單字: correctWords,
        答錯單字: incorrectWords,
        accuracy_rate: Math.round(avgAccuracy * 10) / 10,
        total_sessions: week.session_count,
        total_duration: week.total_duration
      };
    });

    // 排序（按週次）
    data.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.week_number - b.week_number;
    });

    // 計算統計資料
    const totalWordsLearned = data.reduce((sum, week) => sum + week.已教單字, 0);
    const totalWordsCorrect = data.reduce((sum, week) => sum + week.答對單字, 0);
    const totalWordsIncorrect = data.reduce((sum, week) => sum + week.答錯單字, 0);
    const totalSessions = data.reduce((sum, week) => sum + week.total_sessions, 0);
    const totalDuration = data.reduce((sum, week) => sum + week.total_duration, 0);
    const overallAccuracy = totalWordsLearned > 0
      ? Math.round((totalWordsCorrect / totalWordsLearned) * 100 * 10) / 10
      : 0;

    // 找出最佳和最差週
    const bestWeek = data.length > 0
      ? data.reduce((best, curr) => curr.accuracy_rate > best.accuracy_rate ? curr : best, data[0])
      : null;
    const worstWeek = data.length > 0
      ? data.reduce((worst, curr) => curr.accuracy_rate < worst.accuracy_rate && curr.accuracy_rate > 0 ? curr : worst, data[0])
      : null;

    const stats = {
      total_weeks: data.length,
      total_words_learned: totalWordsLearned,
      total_words_correct: totalWordsCorrect,
      total_words_incorrect: totalWordsIncorrect,
      overall_accuracy: overallAccuracy,
      average_words_per_week: data.length > 0 ? Math.round(totalWordsLearned / data.length) : 0,
      total_study_time: totalDuration,
      total_sessions: totalSessions,
      best_week: bestWeek ? {
        week_number: bestWeek.week_number,
        accuracy_rate: bestWeek.accuracy_rate,
        words_learned: bestWeek.已教單字
      } : null,
      worst_week: worstWeek ? {
        week_number: worstWeek.week_number,
        accuracy_rate: worstWeek.accuracy_rate,
        words_learned: worstWeek.已教單字
      } : null
    };

    return NextResponse.json({
      success: true,
      data: data,
      stats: stats,
      metadata: {
        range: range,
        student_id: effectiveStudentId,
        course_id: course_id,
        start_date: startDate,
        end_date: endDate
      }
    });

  } catch (error) {
    console.error('[Vocabulary Stats API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
