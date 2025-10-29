import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/api-auth';

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
      startWeek = currentWeek;
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

// 工具函數：計算每日任務的每日完成狀況
async function calculateDailyCompletion(
  supabase: any,
  assignmentId: string,
  studentId: string,
  weekStart: string,
  weekEnd: string
) {
  // 查詢該週的提交記錄
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('submission_date')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .gte('submission_date', weekStart)
    .lte('submission_date', weekEnd);

  // 建立已完成日期的 Set
  const completedDates = new Set(
    submissions?.map((s: any) => new Date(s.submission_date).toISOString().split('T')[0]) || []
  );

  // 計算該週7天的完成狀況
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const dailyCompletion = [];
  const startDate = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    dailyCompletion.push({
      day: weekDays[i],
      date: dateStr,
      completed: completedDates.has(dateStr)
    });
  }

  // 計算連續天數
  let streakDays = 0;
  for (let i = dailyCompletion.length - 1; i >= 0; i--) {
    if (dailyCompletion[i].completed) {
      streakDays++;
    } else {
      break;
    }
  }

  const completedDays = dailyCompletion.filter(d => d.completed).length;

  return {
    dailyCompletion,
    completedDays,
    totalDays: 7,
    streakDays
  };
}

// GET - 取得作業進度數據
export async function GET(request: NextRequest) {
  try {
    // 驗證 API 金鑰（可選）
    if (process.env.API_KEY) {
      const authResult = await verifyApiKey(request);
      if (!authResult.valid) {
        return NextResponse.json(
          { success: false, error: authResult.error },
          { status: 401 }
        );
      }
    } else {
      console.warn('[Assignments Progress API] API_KEY not configured, skipping API key verification');
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    // 取得查詢參數
    const student_id = searchParams.get('student_id');
    const course_id = searchParams.get('course_id');
    const range = searchParams.get('range') || 'month';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // 驗證必填參數
    if (!student_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: student_id' },
        { status: 400 }
      );
    }

    // 計算日期範圍
    const { startDate, endDate } = getDateRangeFromRange(range, year);

    // 查詢作業
    let assignmentQuery = supabase
      .from('assignments')
      .select('*')
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .eq('is_published', true)
      .order('due_date', { ascending: true });

    if (course_id) {
      assignmentQuery = assignmentQuery.eq('course_id', course_id);
    }

    const { data: assignments, error: assignmentsError } = await assignmentQuery;

    if (assignmentsError) {
      console.error('[Assignments Progress API] Database error:', assignmentsError);
      return NextResponse.json(
        { success: false, error: assignmentsError.message },
        { status: 500 }
      );
    }

    // 查詢該學生的所有提交記錄
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', student_id)
      .gte('submission_date', startDate)
      .lte('submission_date', endDate);

    if (submissionsError) {
      console.error('[Assignments Progress API] Submissions error:', submissionsError);
    }

    // 建立提交記錄的 Map（以 assignment_id 為 key）
    const submissionMap = new Map();
    submissions?.forEach((sub: any) => {
      submissionMap.set(sub.assignment_id, sub);
    });

    // 按週分組作業
    const weeklyData: Record<string, any> = {};

    for (const assignment of assignments || []) {
      const dueDate = new Date(assignment.due_date);
      const weekNumber = getWeekNumber(dueDate);
      const assignmentYear = dueDate.getFullYear();
      const weekKey = `${assignmentYear}-W${weekNumber}`;

      if (!weeklyData[weekKey]) {
        const dateRange = getWeekDateRange(assignmentYear, weekNumber);
        weeklyData[weekKey] = {
          week_number: weekNumber,
          week_label: `第${weekNumber}周`,
          year: assignmentYear,
          date_range: dateRange.label,
          week_start_date: dateRange.start,
          week_end_date: dateRange.end,
          assignments: []
        };
      }

      const submission = submissionMap.get(assignment.id);
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];

      // 判斷作業類型和計算進度
      if (assignment.is_daily) {
        // 每日任務
        const dateRange = getWeekDateRange(assignmentYear, weekNumber);
        const dailyData = await calculateDailyCompletion(
          supabase,
          assignment.id,
          student_id,
          dateRange.start,
          dateRange.end
        );

        const progress = Math.round((dailyData.completedDays / dailyData.totalDays) * 100);

        weeklyData[weekKey].assignments.push({
          id: assignment.id,
          name: assignment.title,
          description: assignment.description || assignment.instructions || '',
          type: 'daily',
          daily_type: assignment.daily_type,
          progress: progress,
          completed_days: dailyData.completedDays,
          total_days: dailyData.totalDays,
          streak_days: dailyData.streakDays,
          daily_completion: dailyData.dailyCompletion
        });
      } else {
        // 單次作業
        let status: string;
        let progress = 0;

        if (submission) {
          status = 'completed';
          progress = 100;
        } else if (dueDate < now) {
          status = 'overdue';
        } else if (assignment.due_date === currentDate) {
          status = 'due_today';
        } else {
          status = 'not_started';
        }

        weeklyData[weekKey].assignments.push({
          id: assignment.id,
          name: assignment.title,
          description: assignment.description || assignment.instructions || '',
          type: 'session',
          assignment_type: assignment.assignment_type || '一般作業',
          progress: progress,
          status: status,
          due_date: assignment.due_date,
          submitted: !!submission,
          submission_date: submission?.submission_date || null,
          score: submission?.score || null,
          max_score: assignment.max_score || 100
        });
      }
    }

    // 計算每週摘要
    const data = Object.values(weeklyData).map((week: any) => {
      const totalAssignments = week.assignments.length;
      const completed = week.assignments.filter((a: any) =>
        a.type === 'daily' ? a.progress === 100 : a.status === 'completed'
      ).length;
      const inProgress = week.assignments.filter((a: any) =>
        a.type === 'daily' ? a.progress > 0 && a.progress < 100 : a.status === 'in_progress'
      ).length;
      const notStarted = week.assignments.filter((a: any) =>
        a.type === 'daily' ? a.progress === 0 : a.status === 'not_started'
      ).length;
      const dailyTasks = week.assignments.filter((a: any) => a.type === 'daily').length;
      const sessionTasks = week.assignments.filter((a: any) => a.type === 'session').length;

      return {
        ...week,
        summary: {
          total_assignments: totalAssignments,
          completed: completed,
          in_progress: inProgress,
          not_started: notStarted,
          completion_rate: totalAssignments > 0 ? Math.round((completed / totalAssignments) * 100) : 0,
          daily_tasks: dailyTasks,
          session_tasks: sessionTasks
        }
      };
    });

    // 排序（按週次，最新的在最前面）
    data.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week_number - a.week_number;
    });

    // 計算整體統計
    const totalAssignments = data.reduce((sum, week) => sum + week.summary.total_assignments, 0);
    const totalCompleted = data.reduce((sum, week) => sum + week.summary.completed, 0);
    const totalInProgress = data.reduce((sum, week) => sum + week.summary.in_progress, 0);
    const totalNotStarted = data.reduce((sum, week) => sum + week.summary.not_started, 0);

    // 計算每日任務最長連續天數
    let maxStreak = 0;
    data.forEach(week => {
      week.assignments.forEach((assignment: any) => {
        if (assignment.type === 'daily' && assignment.streak_days > maxStreak) {
          maxStreak = assignment.streak_days;
        }
      });
    });

    // 計算平均進度
    let totalProgress = 0;
    let progressCount = 0;
    data.forEach(week => {
      week.assignments.forEach((assignment: any) => {
        totalProgress += assignment.progress || 0;
        progressCount++;
      });
    });
    const averageProgress = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;

    // 計算準時完成率
    const submittedOnTime = submissions?.filter((sub: any) => !sub.is_late).length || 0;
    const totalSubmissions = submissions?.length || 0;
    const onTimeRate = totalSubmissions > 0 ? Math.round((submittedOnTime / totalSubmissions) * 100) : 0;

    const stats = {
      total_weeks: data.length,
      total_assignments: totalAssignments,
      total_completed: totalCompleted,
      total_in_progress: totalInProgress,
      total_not_started: totalNotStarted,
      overall_completion_rate: totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0,
      daily_task_streak: maxStreak,
      average_progress: averageProgress,
      on_time_completion_rate: onTimeRate
    };

    return NextResponse.json({
      success: true,
      data: data,
      stats: stats,
      metadata: {
        range: range,
        student_id: student_id,
        course_id: course_id,
        start_date: startDate,
        end_date: endDate
      }
    });

  } catch (error) {
    console.error('[Assignments Progress API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
