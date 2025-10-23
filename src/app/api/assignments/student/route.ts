import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { ApiResponse } from '@/types/learning-management';

// GET - 獲取學生專屬的專案作業列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const statusFilter = searchParams.get('status'); // 可選：in_progress, completed

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少必填參數',
        message: '需要提供 student_id'
      }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // 查詢該學生的專案作業
    // 透過 assignment_submissions 關聯來獲取學生專屬的作業
    let query = supabase
      .from('assignments')
      .select(`
        *,
        assignment_submissions!inner (
          id,
          student_id,
          submission_date,
          status,
          score,
          content,
          file_url,
          feedback
        )
      `)
      .eq('is_project_assignment', true)
      .eq('is_published', true)
      .eq('assignment_submissions.student_id', studentId);

    // 如果有狀態篩選，只顯示進行中和已完成
    if (statusFilter) {
      const statuses = statusFilter.split(',');
      query = query.in('assignment_submissions.status', statuses);
    } else {
      // 預設只顯示 in_progress 和 completed
      query = query.in('assignment_submissions.status', ['in_progress', 'completed']);
    }

    query = query.order('due_date', { ascending: true });

    const { data: assignments, error } = await query;

    if (error) {
      console.error('獲取學生專案作業失敗:', error);
      throw error;
    }

    // 轉換數據格式
    const formattedAssignments = (assignments || []).map((row: any) => {
      // 因為使用 inner join，每個作業都會有對應的 submission
      const submission = Array.isArray(row.assignment_submissions)
        ? row.assignment_submissions[0]
        : row.assignment_submissions;

      // 計算進度
      let progress = 0;
      if (submission) {
        if (submission.status === 'completed' || submission.status === 'graded') {
          progress = 100;
        } else if (submission.status === 'in_progress') {
          progress = 50; // 預設進行中為 50%，可以後續改為從 submission 中讀取
        }
      }

      // 計算狀態
      let status = 'not_started';
      if (submission) {
        if (submission.status === 'completed' || submission.status === 'graded') {
          status = 'completed';
        } else if (submission.status === 'in_progress') {
          status = 'in_progress';
        } else if (row.due_date && new Date(row.due_date) < new Date()) {
          status = 'overdue';
        } else {
          status = 'pending';
        }
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        courseId: row.course_id,
        lessonId: row.lesson_id,
        startDate: row.created_at,
        dueDate: row.due_date,
        completedDate: submission?.submission_date,
        status: status,
        submissionStatus: submission?.status || 'not_submitted',
        score: submission?.score,
        maxScore: row.max_score || 100,
        priority: row.priority || 'medium',
        category: row.assignment_type || 'task',
        submissionType: row.submission_type || 'text',
        estimatedDuration: row.estimated_duration,
        progress: progress,
        isRequired: row.is_required,
        isPublished: row.is_published,
        isProjectAssignment: row.is_project_assignment,
        templateId: row.template_id,
        tags: row.tags || [],
        resources: row.resources || [],
        instructions: row.instructions,
        requirements: row.requirements,
        // 提交相關資訊
        submissionId: submission?.id,
        submissionContent: submission?.content,
        submissionFileUrl: submission?.file_url,
        feedback: submission?.feedback,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: formattedAssignments,
      message: `成功獲取 ${formattedAssignments.length} 項專案作業`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('獲取學生專案作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '獲取學生專案作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
