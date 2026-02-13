import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/api-auth';
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
  let startYear: number = currentYear;
  let endYear: number = currentYear;

  switch (range) {
    case 'week':
      // 最近 2 週
      startWeek = Math.max(1, currentWeek - 1);
      endWeek = currentWeek;
      break;
    case 'month':
      // 最近 4 週
      startWeek = Math.max(1, currentWeek - 3);
      endWeek = currentWeek;
      break;
    case 'quarter':
      // 最近 12 週
      startWeek = Math.max(1, currentWeek - 11);
      endWeek = currentWeek;
      break;
    case 'semester':
      // 最近 18 週
      startWeek = Math.max(1, currentWeek - 17);
      endWeek = currentWeek;
      break;
    case 'all':
      // 全部資料（整年）
      startWeek = 1;
      endWeek = 52;
      break;
    default:
      // 預設最近 4 週
      startWeek = Math.max(1, currentWeek - 3);
      endWeek = currentWeek;
  }

  const startDate = getWeekDateRange(startYear, startWeek);
  const endDate = getWeekDateRange(endYear, endWeek);

  return {
    startDate: startDate.start,
    endDate: endDate.end,
    startWeek,
    endWeek,
    startYear,
    endYear
  };
}

// GET - 取得成績趨勢數據
export async function GET(request: NextRequest) {
  try {
    // Cookie 認證
    const { user: authUser } = await authenticateRequest(request);
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
    const { startDate, endDate, startWeek, endWeek } = getDateRangeFromRange(range, year);

    // 查詢考試記錄
    let query = supabase
      .from('exam_records')
      .select('*')
      .eq('student_id', effectiveStudentId)
      .gte('exam_date', startDate)
      .lte('exam_date', endDate)
      .order('exam_date', { ascending: true });

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    const { data: examRecords, error: examError } = await query;

    if (examError) {
      console.error('[Grades API] Database error:', examError);
      return NextResponse.json(
        { success: false, error: examError.message },
        { status: 500 }
      );
    }

    // 查詢考試類型（用於動態生成欄位）
    const { data: examTypes, error: typesError } = await supabase
      .from('exam_types')
      .select('name, display_name, color')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (typesError) {
      console.error('[Grades API] Exam types error:', typesError);
      // 如果查詢失敗，使用預設類型
    }

    // 按週分組並計算每個考試類型的平均分
    const weeklyGrades: Record<string, any> = {};

    examRecords?.forEach((exam) => {
      const examDate = new Date(exam.exam_date);
      const weekNumber = getWeekNumber(examDate);
      const examYear = examDate.getFullYear();
      const weekKey = `${examYear}-W${weekNumber}`;

      if (!weeklyGrades[weekKey]) {
        weeklyGrades[weekKey] = {
          week_number: weekNumber,
          year: examYear,
          counts: {},
          sums: {}
        };
      }

      const examType = exam.exam_type;
      if (!weeklyGrades[weekKey].counts[examType]) {
        weeklyGrades[weekKey].counts[examType] = 0;
        weeklyGrades[weekKey].sums[examType] = 0;
      }

      weeklyGrades[weekKey].counts[examType]++;
      weeklyGrades[weekKey].sums[examType] += exam.percentage_score || 0;
    });

    // 轉換為前端需要的格式
    const data = Object.values(weeklyGrades).map((week: any) => {
      const dateRange = getWeekDateRange(week.year, week.week_number);
      const weekData: any = {
        week_number: week.week_number,
        week_label: `第${week.week_number}週`,
        year: week.year,
        week_start_date: dateRange.start,
        week_end_date: dateRange.end,
        month: new Date(dateRange.start).getMonth() + 1
      };

      // 為每個考試類型計算平均分
      Object.keys(week.counts).forEach((examType) => {
        const count = week.counts[examType];
        const sum = week.sums[examType];
        weekData[examType] = count > 0 ? Math.round(sum / count) : 0;
      });

      return weekData;
    });

    // 排序（按週次）
    data.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.week_number - b.week_number;
    });

    // 計算統計資料
    let totalScore = 0;
    let totalCount = 0;
    const byExamType: Record<string, { sum: number; count: number }> = {};

    examRecords?.forEach((exam) => {
      totalScore += exam.percentage_score || 0;
      totalCount++;

      const examType = exam.exam_type;
      if (!byExamType[examType]) {
        byExamType[examType] = { sum: 0, count: 0 };
      }
      byExamType[examType].sum += exam.percentage_score || 0;
      byExamType[examType].count++;
    });

    const stats = {
      total_weeks: data.length,
      total_exams: totalCount,
      average_score: totalCount > 0 ? Math.round(totalScore / totalCount * 10) / 10 : 0,
      highest_week: data.length > 0 ? (() => {
        const weekAverages = data.map((week) => {
          const examTypes = Object.keys(week).filter(key => !['week_number', 'week_label', 'year', 'week_start_date', 'week_end_date', 'month'].includes(key));
          const scores = examTypes.map(type => week[type]).filter(score => score > 0);
          const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          return { week_number: week.week_number, average: avg };
        });
        const highest = weekAverages.reduce((max, curr) => curr.average > max.average ? curr : max, weekAverages[0]);
        return highest;
      })() : null,
      lowest_week: data.length > 0 ? (() => {
        const weekAverages = data.map((week) => {
          const examTypes = Object.keys(week).filter(key => !['week_number', 'week_label', 'year', 'week_start_date', 'week_end_date', 'month'].includes(key));
          const scores = examTypes.map(type => week[type]).filter(score => score > 0);
          const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          return { week_number: week.week_number, average: avg };
        });
        const lowest = weekAverages.reduce((min, curr) => curr.average < min.average && curr.average > 0 ? curr : min, weekAverages[0]);
        return lowest;
      })() : null,
      by_exam_type: Object.keys(byExamType).reduce((acc, type) => {
        const { sum, count } = byExamType[type];
        acc[type] = {
          average: count > 0 ? Math.round(sum / count * 10) / 10 : 0,
          count: count
        };
        return acc;
      }, {} as Record<string, { average: number; count: number }>)
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
        end_date: endDate,
        exam_types: examTypes || []
      }
    });

  } catch (error) {
    console.error('[Grades API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
