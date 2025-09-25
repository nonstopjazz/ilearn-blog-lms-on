import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
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

  // 取得總作業數
  const { data: totalAssignments } = await supabase
    .from('assignments')
    .select('id')
    .eq('is_published', true);

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
    assignments_total: totalAssignments?.length || 0,
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

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase 初始化失敗' },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 使用與 requests 頁面完全相同的查詢方式
    const { data: approvedRequests, error: requestsError } = await supabase
      .from('course_requests')
      .select('*')
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false });

    if (requestsError) {
      console.error('[Admin Students API] Error fetching course requests:', requestsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch student data' },
        { status: 500 }
      );
    }

    if (!approvedRequests || approvedRequests.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          offset,
          limit
        }
      });
    }

    // 從批准的申請中提取唯一的學生 - 確保使用正確的資料結構
    const uniqueStudents = new Map();
    approvedRequests.forEach(request => {
      if (!uniqueStudents.has(request.user_id)) {
        uniqueStudents.set(request.user_id, {
          id: request.user_id,
          name: request.user_info?.name || '未知學生',
          email: request.user_info?.email || 'no-email@example.com',
          first_approved_at: request.reviewed_at
        });
      }
    });

    // 轉換為陣列並分頁
    const studentsList = Array.from(uniqueStudents.values()).slice(offset, offset + limit);

    // 為每個被批准的學生建立統計資料
    const students = [];
    for (const studentInfo of studentsList) {
      const student = await buildStudentStats(
        supabase,
        studentInfo.id,
        studentInfo.name,
        studentInfo.email
      );
      students.push(student);
    }

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        total: uniqueStudents.size,
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
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase 初始化失敗' },
        { status: 500 }
      );
    }

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