import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 計算日期範圍
 */
function calculateDateRange(range: string) {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (range) {
    case 'week':
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
    case 'monthly':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
    case 'quarterly':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
    case 'yearly':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date('2020-01-01'); // 系統開始日期
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * GET /api/admin/students/[id]/learning-data
 * 取得學生完整學習資料（用於報表生成）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';
    const customStart = searchParams.get('start');
    const customEnd = searchParams.get('end');

    // 計算日期範圍
    let startDate: string;
    let endDate: string;

    if (customStart && customEnd) {
      startDate = customStart;
      endDate = customEnd;
    } else {
      const dateRange = calculateDateRange(range);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    // 1. 取得學生基本資訊
    const { data: studentInfo, error: studentError } = await supabase
      .from('course_requests')
      .select('user_id, user_info')
      .eq('user_id', studentId)
      .eq('status', 'approved')
      .limit(1);

    if (studentError || !studentInfo || studentInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: '找不到學生資料' },
        { status: 404 }
      );
    }

    const student = studentInfo[0];

    // 2. 並行查詢所有學習資料
    const [vocabularyResult, examsResult, assignmentsResult, progressResult] = await Promise.all([
      // 單字學習資料
      supabase
        .from('vocabulary_sessions')
        .select('*')
        .eq('student_id', studentId)
        .gte('session_date', startDate)
        .lte('session_date', endDate)
        .order('session_date', { ascending: true }),

      // 考試成績資料
      supabase
        .from('exam_records')
        .select('*')
        .eq('student_id', studentId)
        .gte('exam_date', startDate)
        .lte('exam_date', endDate)
        .order('exam_date', { ascending: true }),

      // 作業提交資料
      supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments(*)
        `)
        .eq('student_id', studentId)
        .gte('submission_date', startDate)
        .lte('submission_date', endDate)
        .order('submission_date', { ascending: true }),

      // 學習進度統計
      supabase
        .from('learning_progress_stats')
        .select('*')
        .eq('student_id', studentId)
        .order('year', { ascending: true })
        .order('week_number', { ascending: true })
    ]);

    // 3. 計算統計數據
    const vocabularyData = vocabularyResult.data || [];
    const examData = examsResult.data || [];
    const assignmentData = assignmentsResult.data || [];
    const progressData = progressResult.data || [];

    // 單字統計
    const totalWords = vocabularyData.reduce((sum, v) => sum + (v.words_learned || 0), 0);
    const avgAccuracy = vocabularyData.length > 0
      ? vocabularyData.reduce((sum, v) => sum + (v.accuracy_rate || 0), 0) / vocabularyData.length
      : 0;
    const totalStudyTime = vocabularyData.reduce((sum, v) => sum + (v.session_duration || 0), 0);

    // 考試統計
    const totalExams = examData.length;
    const avgExamScore = examData.length > 0
      ? examData.reduce((sum, e) => sum + (e.percentage_score || 0), 0) / examData.length
      : 0;
    const highestScore = examData.length > 0
      ? Math.max(...examData.map(e => e.percentage_score || 0))
      : 0;
    const lowestScore = examData.length > 0
      ? Math.min(...examData.map(e => e.percentage_score || 0))
      : 0;

    // 作業統計
    const totalAssignments = assignmentData.length;
    const completedAssignments = assignmentData.filter(a => a.status === 'graded' || a.status === 'returned').length;
    const avgAssignmentScore = assignmentData.filter(a => a.score !== null).length > 0
      ? assignmentData.filter(a => a.score !== null).reduce((sum, a) => sum + (a.score || 0), 0) / assignmentData.filter(a => a.score !== null).length
      : 0;
    const lateSubmissions = assignmentData.filter(a => a.is_late).length;

    // 4. 組織回傳資料
    const response = {
      success: true,
      data: {
        student: {
          id: studentId,
          name: student.user_info?.name || '未知學生',
          email: student.user_info?.email || '',
          phone: student.user_info?.phone || null,
          parent: student.user_info?.parent || null,
        },
        date_range: {
          start: startDate,
          end: endDate,
          range: range
        },
        summary: {
          vocabulary: {
            total_words: totalWords,
            avg_accuracy: parseFloat(avgAccuracy.toFixed(1)),
            total_study_time: totalStudyTime,
            sessions_count: vocabularyData.length
          },
          exams: {
            total_exams: totalExams,
            avg_score: parseFloat(avgExamScore.toFixed(1)),
            highest_score: highestScore,
            lowest_score: lowestScore
          },
          assignments: {
            total_assignments: totalAssignments,
            completed: completedAssignments,
            completion_rate: totalAssignments > 0 ? parseFloat(((completedAssignments / totalAssignments) * 100).toFixed(1)) : 0,
            avg_score: parseFloat(avgAssignmentScore.toFixed(1)),
            late_submissions: lateSubmissions
          }
        },
        details: {
          vocabulary: vocabularyData,
          exams: examData,
          assignments: assignmentData,
          progress: progressData
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('取得學生學習資料時發生錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
