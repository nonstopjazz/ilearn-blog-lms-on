import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { ApiResponse } from '@/types/learning-management';

// GET - 獲取所有學生的專案作業（Admin 用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id'); // 可選：篩選特定學生
    const status = searchParams.get('status'); // 可選：篩選狀態

    const supabase = createSupabaseAdminClient();

    // 查詢所有專案作業及其提交狀態
    let query = supabase
      .from('assignments')
      .select(`
        *,
        assignment_submissions (
          id,
          student_id,
          submission_date,
          status,
          score,
          content,
          file_url,
          feedback,
          graded_by,
          graded_at
        )
      `)
      .eq('is_project_assignment', true)
      .order('created_at', { ascending: false });

    const { data: assignments, error } = await query;

    if (error) {
      console.error('獲取專案作業失敗:', error);
      throw error;
    }

    // 獲取學生資訊以顯示名稱
    const { data: users } = await supabase.auth.admin.listUsers();
    const userMap = new Map(users.users.map(u => [u.id, u]));

    // 格式化數據，展開每個學生的提交記錄
    const formattedData: any[] = [];

    (assignments || []).forEach((assignment: any) => {
      const submissions = assignment.assignment_submissions || [];

      if (submissions.length === 0) {
        // 如果沒有任何提交記錄，只顯示作業本身
        formattedData.push({
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          assignmentDescription: assignment.description,
          dueDate: assignment.due_date,
          maxScore: assignment.max_score,
          priority: assignment.priority,
          templateId: assignment.template_id,
          studentId: null,
          studentName: '未分配',
          studentEmail: null,
          submissionId: null,
          submissionStatus: 'not_assigned',
          submissionDate: null,
          score: null,
          progress: 0,
          feedback: null
        });
      } else {
        submissions.forEach((submission: any) => {
          // 應用篩選條件
          if (studentId && submission.student_id !== studentId) return;
          if (status && submission.status !== status) return;

          const user = userMap.get(submission.student_id);
          const userMetadata = user?.user_metadata || {};

          formattedData.push({
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            assignmentDescription: assignment.description,
            dueDate: assignment.due_date,
            maxScore: assignment.max_score || 100,
            priority: assignment.priority || 'medium',
            templateId: assignment.template_id,
            courseId: assignment.course_id,
            requirements: assignment.requirements,
            instructions: assignment.instructions,
            tags: assignment.tags || [],
            // 學生資訊
            studentId: submission.student_id,
            studentName: userMetadata.full_name || userMetadata.name || user?.email || '未知',
            studentEmail: user?.email,
            // 提交資訊
            submissionId: submission.id,
            submissionStatus: submission.status || 'not_started',
            submissionDate: submission.submission_date,
            submissionContent: submission.content,
            submissionFileUrl: submission.file_url,
            score: submission.score,
            feedback: submission.feedback,
            gradedBy: submission.graded_by,
            gradedAt: submission.graded_at,
            // 計算進度
            progress: submission.status === 'completed' || submission.status === 'graded' ? 100
                    : submission.status === 'in_progress' ? 50
                    : 0
          });
        });
      }
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: formattedData,
      message: `成功獲取 ${formattedData.length} 筆專案作業記錄`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('獲取專案作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '獲取專案作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH - 更新學生的專案作業狀態（Admin 用）
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, status, score, feedback, progress } = body;

    if (!submissionId) {
      return NextResponse.json({
        success: false,
        error: '缺少必填參數',
        message: '需要提供 submissionId'
      }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // 準備更新資料
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (feedback !== undefined) updateData.feedback = feedback;

    // 如果狀態變更為 graded，記錄評分時間
    if (status === 'graded') {
      updateData.graded_at = new Date().toISOString();
      // TODO: 從 session 中獲取當前管理員 ID
      // updateData.graded_by = adminUserId;
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('更新提交狀態失敗:', error);
      throw error;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: data,
      message: '成功更新專案作業狀態'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('更新專案作業狀態失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '更新專案作業狀態失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
