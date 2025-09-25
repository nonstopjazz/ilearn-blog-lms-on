import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/api-auth';

// 建立學生統計資料的輔助函數
async function buildStudentStats(supabase: any, studentId: string, name: string, email: string) {
  // 單字學習統計
  const { data: vocabStats } = await supabase
    .from('vocabulary_sessions')
    .select('words_learned, accuracy_rate, session_date')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false });

  // 考試統計
  const { data: examStats } = await supabase
    .from('exam_records')
    .select('percentage_score, exam_date')
    .eq('student_id', studentId)
    .order('exam_date', { ascending: false });

  // 作業統計
  const { data: assignmentStats } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, submission_date')
    .eq('student_id', studentId)
    .order('submission_date', { ascending: false });

  // 計算統計數據
  const totalWords = vocabStats?.reduce((sum, v) => sum + (v.words_learned || 0), 0) || 0;
  const avgAccuracy = vocabStats && vocabStats.length > 0
    ? vocabStats.reduce((sum, v) => sum + (v.accuracy_rate || 0), 0) / vocabStats.length
    : 0;

  const avgExamScore = examStats && examStats.length > 0
    ? examStats.reduce((sum, e) => sum + (e.percentage_score || 0), 0) / examStats.length
    : 0;

  const lastActivity = [
    ...(vocabStats?.map(v => v.session_date) || []),
    ...(examStats?.map(e => e.exam_date) || []),
    ...(assignmentStats?.map(a => a.submission_date?.split('T')[0]) || [])
  ].sort().pop() || 'N/A';

  return {
    id: studentId,
    name: name,
    email: email,
    total_words: totalWords,
    avg_accuracy: parseFloat(avgAccuracy.toFixed(1)),
    total_exams: examStats?.length || 0,
    avg_exam_score: parseFloat(avgExamScore.toFixed(1)),
    assignments_completed: assignmentStats?.length || 0,
    assignments_total: assignmentStats?.length || 0, // 需要從 assignments 表計算
    last_activity: lastActivity,
    status: 'active'
  };
}

// GET - 取得所有學生的學習統計
export async function GET(request: NextRequest) {
  try {
    // 驗證 API 金鑰（開發環境下會自動通過）
    const authResult = await verifyApiKey(request);
    if (!authResult.valid && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 從 Supabase auth.users 取得所有用戶（學生）
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('[Admin Students API] Auth error:', authError);
      // 如果無法取得 auth users，從學習記錄中提取

      // 從單字學習記錄中取得所有學生
      const { data: vocabularyData } = await supabase
        .from('vocabulary_sessions')
        .select('student_id')
        .order('created_at', { ascending: false });

      // 從考試記錄中取得學生
      const { data: examData } = await supabase
        .from('exam_records')
        .select('student_id')
        .order('created_at', { ascending: false });

      // 從作業提交中取得學生
      const { data: submissionData } = await supabase
        .from('assignment_submissions')
        .select('student_id')
        .order('created_at', { ascending: false });

      // 合併並去重學生 ID
      const allStudentIds = new Set([
        ...(vocabularyData?.map(v => v.student_id) || []),
        ...(examData?.map(e => e.student_id) || []),
        ...(submissionData?.map(s => s.student_id) || [])
      ]);

      const students = [];
      for (const studentId of Array.from(allStudentIds).slice(offset, offset + limit)) {
        const student = await buildStudentStats(supabase, studentId, `學生 ${studentId.slice(0, 8)}`, `${studentId.slice(0, 8)}@example.com`);
        students.push(student);
      }

      return NextResponse.json({
        success: true,
        data: students,
        pagination: {
          total: allStudentIds.size,
          offset,
          limit
        }
      });
    }

    // 篩選出非 admin 用戶（學生）
    const studentUsers = authUsers.users.filter(user => {
      // 假設 admin 用戶有特定的 email 或 metadata
      return !user.email?.includes('admin') && user.email_confirmed_at;
    }).slice(offset, offset + limit);

    const students = [];

    // 為每個真實學生建立統計資料
    for (const user of studentUsers) {
      const student = await buildStudentStats(
        supabase,
        user.id,
        user.user_metadata?.name || user.email?.split('@')[0] || '未知用戶',
        user.email || 'no-email@example.com'
      );
      students.push(student);
    }

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        total: authUsers.users.filter(user =>
          !user.email?.includes('admin') && user.email_confirmed_at
        ).length,
        offset,
        limit
      }
    });

  } catch (error) {
    console.error('[Admin Students API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 新增學生學習記錄
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyApiKey(request);
    if (!authResult.valid && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = getSupabase();

    const { student_id, record_type, data } = body;

    if (!student_id || !record_type || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;

    switch (record_type) {
      case 'vocabulary':
        const { data: vocabResult, error: vocabError } = await supabase
          .from('vocabulary_sessions')
          .insert([{
            student_id,
            course_id: data.course_id,
            session_date: data.session_date,
            start_number: data.start_number,
            end_number: data.end_number,
            session_duration: data.session_duration,
            accuracy_rate: data.accuracy_rate,
            notes: data.notes
          }])
          .select()
          .single();

        if (vocabError) throw vocabError;
        result = vocabResult;
        break;

      case 'exam':
        const { data: examResult, error: examError } = await supabase
          .from('exam_records')
          .insert([{
            student_id,
            course_id: data.course_id,
            exam_type: data.exam_type,
            exam_name: data.exam_name,
            exam_date: data.exam_date,
            total_score: data.total_score,
            max_score: data.max_score || 100,
            subject: data.subject,
            teacher_feedback: data.teacher_feedback
          }])
          .select()
          .single();

        if (examError) throw examError;
        result = examResult;
        break;

      case 'assignment':
        const { data: assignResult, error: assignError } = await supabase
          .from('assignment_submissions')
          .insert([{
            assignment_id: data.assignment_id,
            student_id,
            submission_type: data.submission_type || 'text',
            content: data.content,
            score: data.score,
            max_score: data.max_score,
            feedback: data.feedback,
            status: data.status || 'submitted'
          }])
          .select()
          .single();

        if (assignError) throw assignError;
        result = assignResult;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid record type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Record created successfully'
    });

  } catch (error) {
    console.error('[Admin Students API] Create error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}