import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { ApiResponse } from '@/types/learning-management';

// GET - 獲取作業列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const courseId = searchParams.get('course_id');
    const isPublished = searchParams.get('is_published');

    const supabase = createSupabaseAdminClient();

    // 建立查詢
    let query = supabase
      .from('assignments')
      .select(`
        *,
        assignment_submissions (
          id,
          student_id,
          submission_date,
          status,
          score
        )
      `);

    // 篩選條件
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (isPublished !== null) {
      query = query.eq('is_published', isPublished === 'true');
    }

    // 如果有 studentId，過濾該學生的提交記錄
    if (studentId) {
      query = query.eq('assignment_submissions.student_id', studentId);
    }

    query = query.order('due_date', { ascending: true });

    const { data: assignments, error } = await query;

    if (error) {
      console.error('獲取作業列表失敗:', error);
      throw error;
    }

    // 轉換數據格式
    const formattedAssignments = (assignments || []).map((row: any) => {
      const submission = studentId && row.assignment_submissions
        ? row.assignment_submissions.find((s: any) => s.student_id === studentId)
        : null;

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        courseId: row.course_id,
        lessonId: row.lesson_id,
        startDate: row.created_at,
        dueDate: row.due_date,
        completedDate: submission?.submission_date,
        status: submission
          ? (submission.status === 'graded' ? 'completed' : 'pending')
          : (row.due_date && new Date(row.due_date) < new Date() ? 'overdue' : 'pending'),
        submissionStatus: submission?.status || 'not_submitted',
        score: submission?.score,
        maxScore: row.max_score || 100,
        priority: row.priority || 'medium',
        category: row.assignment_type || '一般作業',
        submissionType: row.submission_type || 'text',
        estimatedDuration: row.estimated_duration,
        progress: submission ? 100 : 0,
        isRequired: row.is_required,
        isPublished: row.is_published,
        isDaily: row.is_daily || false,
        weekNumber: row.week_number,
        dailyType: row.daily_type,
        tags: row.tags || [],
        resources: row.resources || [],
        instructions: row.instructions,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: formattedAssignments,
      message: `成功獲取 ${formattedAssignments.length} 項作業`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('獲取作業列表失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '獲取作業列表失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST - 新增作業
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      courseId,
      lessonId,
      studentIds,
      dueDate,
      assignmentType,
      priority,
      submissionType,
      maxScore,
      estimatedDuration,
      isRequired,
      instructions,
      tags,
      resources,
      repeatSchedule,
      requirements
    } = body;

    // 驗證必填欄位
    if (!title || !dueDate) {
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位',
        message: '標題和截止日期為必填欄位'
      }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // 創建一個作業記錄
    const { data: createdAssignment, error: insertError } = await supabase
      .from('assignments')
      .insert({
        title,
        description: description || null,
        course_id: courseId || null,
        lesson_id: lessonId || null,
        due_date: dueDate,
        assignment_type: assignmentType || '一般作業',
        priority: priority || 'medium',
        submission_type: submissionType || 'text',
        max_score: maxScore || 100,
        estimated_duration: estimatedDuration || null,
        is_required: isRequired || false,
        instructions: instructions || null,
        tags: tags || [],
        resources: resources || [],
        repeat_schedule: repeatSchedule || {},
        requirements: requirements || {},
        is_published: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('新增作業失敗:', insertError);
      throw insertError;
    }

    // 如果有指定學生列表，為每個學生創建初始的提交記錄
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      const submissions = studentIds.map(studentId => ({
        assignment_id: createdAssignment.id,
        student_id: studentId,
        status: 'not_submitted'
      }));

      const { error: submissionError } = await supabase
        .from('assignment_submissions')
        .insert(submissions);

      if (submissionError) {
        console.error('創建提交記錄失敗:', submissionError);
        // 不中斷，只記錄錯誤
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: createdAssignment,
      message: `成功創建作業${studentIds && studentIds.length > 0 ? `並分配給 ${studentIds.length} 位學生` : ''}`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('新增作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '新增作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
