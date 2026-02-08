import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAuthUserFromCookies } from '@/lib/api-auth';
import { isAdmin } from '@/lib/security-config';
import type { ExamRecord, ApiResponse } from '@/types/learning-management';

// GET - 取得考試記錄
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

    const student_id = searchParams.get('student_id');
    // IDOR 防護：只允許查看自己的資料，除非是管理員
    const effectiveStudentId = student_id && student_id !== authUser.id && isAdmin(authUser)
      ? student_id
      : authUser.id;
    const course_id = searchParams.get('course_id');
    const exam_type = searchParams.get('exam_type');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('exam_records')
      .select('*')
      .order('exam_date', { ascending: false })
      .range(offset, offset + limit - 1);

    query = query.eq('student_id', effectiveStudentId);
    if (course_id) {
      query = query.eq('course_id', course_id);
    }
    if (exam_type) {
      query = query.eq('exam_type', exam_type);
    }
    if (date_from) {
      query = query.gte('exam_date', date_from);
    }
    if (date_to) {
      query = query.lte('exam_date', date_to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Exam API] Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 計算統計資料
    const stats = data && data.length > 0 ? {
      total_exams: data.length,
      average_score: data.reduce((sum, exam) => sum + (exam.percentage_score || 0), 0) / data.length,
      highest_score: Math.max(...data.map(exam => exam.percentage_score || 0)),
      lowest_score: Math.min(...data.map(exam => exam.percentage_score || 0)),
      by_type: data.reduce((acc, exam) => {
        acc[exam.exam_type] = (acc[exam.exam_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    } : null;

    return NextResponse.json({
      success: true,
      data: data,
      stats: stats,
      pagination: {
        total: count,
        offset: offset,
        limit: limit
      }
    } as ApiResponse<ExamRecord[]>);

  } catch (error) {
    console.error('[Exam API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 新增考試記錄
export async function POST(request: NextRequest) {
  try {
    // Cookie 認證
    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = getSupabase();

    // IDOR 防護：只允許操作自己的資料，除非是管理員
    const effectiveStudentId = body.student_id && body.student_id !== authUser.id && isAdmin(authUser)
      ? body.student_id
      : authUser.id;

    // 驗證必填欄位
    if (!body.course_id || !body.exam_type ||
        !body.exam_name || !body.exam_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 計算成績等級
    let grade = '';
    if (body.percentage_score !== undefined) {
      if (body.percentage_score >= 90) grade = 'A+';
      else if (body.percentage_score >= 85) grade = 'A';
      else if (body.percentage_score >= 80) grade = 'B+';
      else if (body.percentage_score >= 75) grade = 'B';
      else if (body.percentage_score >= 70) grade = 'C+';
      else if (body.percentage_score >= 65) grade = 'C';
      else if (body.percentage_score >= 60) grade = 'D';
      else grade = 'F';
    }

    // 新增記錄
    const { data, error } = await supabase
      .from('exam_records')
      .insert([{
        student_id: effectiveStudentId,
        course_id: body.course_id,
        exam_type: body.exam_type,
        exam_name: body.exam_name,
        exam_date: body.exam_date,
        subject: body.subject,
        total_score: body.total_score,
        max_score: body.max_score || 100,
        grade: grade || body.grade,
        class_rank: body.class_rank,
        class_size: body.class_size,
        topics: body.topics,
        mistakes: body.mistakes,
        teacher_feedback: body.teacher_feedback,
        improvement_areas: body.improvement_areas,
        is_retake: body.is_retake || false,
        original_exam_id: body.original_exam_id,
        attachment_url: body.attachment_url
      }])
      .select()
      .single();

    if (error) {
      console.error('[Exam API] Insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 如果成績低於標準，可能需要發送通知
    if (body.percentage_score && body.percentage_score < 60) {
      // 這裡可以加入發送通知的邏輯
      console.log(`Low score alert for student ${effectiveStudentId}: ${body.percentage_score}%`);
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Exam record created successfully'
    } as ApiResponse<ExamRecord>);

  } catch (error) {
    console.error('[Exam API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - 更新考試記錄
export async function PUT(request: NextRequest) {
  try {
    // Cookie 認證
    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = getSupabase();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Exam record ID is required' },
        { status: 400 }
      );
    }

    // 準備更新資料
    const updateData: any = {};
    const allowedFields = [
      'exam_name', 'exam_date', 'subject', 'total_score', 'max_score',
      'grade', 'class_rank', 'class_size', 'topics', 'mistakes',
      'teacher_feedback', 'improvement_areas', 'attachment_url'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // 如果更新了分數，重新計算等級
    if (updateData.total_score !== undefined && updateData.max_score !== undefined) {
      const percentage = (updateData.total_score / updateData.max_score) * 100;
      if (percentage >= 90) updateData.grade = 'A+';
      else if (percentage >= 85) updateData.grade = 'A';
      else if (percentage >= 80) updateData.grade = 'B+';
      else if (percentage >= 75) updateData.grade = 'B';
      else if (percentage >= 70) updateData.grade = 'C+';
      else if (percentage >= 65) updateData.grade = 'C';
      else if (percentage >= 60) updateData.grade = 'D';
      else updateData.grade = 'F';
    }

    // 更新記錄
    const { data, error } = await supabase
      .from('exam_records')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('[Exam API] Update error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Exam record updated successfully'
    } as ApiResponse<ExamRecord>);

  } catch (error) {
    console.error('[Exam API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 刪除考試記錄
export async function DELETE(request: NextRequest) {
  try {
    // Cookie 認證
    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exam record ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('exam_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Exam API] Delete error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exam record deleted successfully'
    });

  } catch (error) {
    console.error('[Exam API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}