import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentEmail = searchParams.get('student_email') || 'nonstopjazz@gmail.com';

    const supabase = createSupabaseAdminClient();

    // 1. 查找學生資訊
    const { data: users } = await supabase.auth.admin.listUsers();
    const student = users.users.find(u => u.email?.toLowerCase() === studentEmail.toLowerCase());

    if (!student) {
      return NextResponse.json({
        success: false,
        error: `找不到 email 為 ${studentEmail} 的學生`,
        availableUsers: users.users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.user_metadata?.name
        }))
      });
    }

    // 2. 查詢所有專案作業
    const { data: allProjectAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('is_project_assignment', true);

    if (assignmentsError) {
      throw assignmentsError;
    }

    // 3. 查詢該學生的所有提交記錄
    const { data: allSubmissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', student.id);

    if (submissionsError) {
      throw submissionsError;
    }

    // 4. 查詢該學生的專案作業提交記錄
    const projectAssignmentIds = allProjectAssignments?.map(a => a.id) || [];
    const projectSubmissions = allSubmissions?.filter(s =>
      projectAssignmentIds.includes(s.assignment_id)
    ) || [];

    // 5. 詳細分析每個專案作業
    const detailedAnalysis = (allProjectAssignments || []).map(assignment => {
      const submission = allSubmissions?.find(s => s.assignment_id === assignment.id);

      const meetsConditions = {
        is_project_assignment: assignment.is_project_assignment === true,
        is_published: assignment.is_published === true,
        has_submission: !!submission,
        submission_status: submission?.status || 'no_submission',
        status_in_progress_or_completed: submission ? ['in_progress', 'completed'].includes(submission.status) : false
      };

      const shouldBeVisible =
        meetsConditions.is_project_assignment &&
        meetsConditions.is_published &&
        meetsConditions.has_submission &&
        meetsConditions.status_in_progress_or_completed;

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        is_project_assignment: assignment.is_project_assignment,
        is_published: assignment.is_published,
        submission: submission ? {
          id: submission.id,
          status: submission.status,
          created_at: submission.created_at
        } : null,
        meetsConditions,
        shouldBeVisible,
        reason: !shouldBeVisible ? (
          !meetsConditions.is_project_assignment ? '❌ 不是專案作業' :
          !meetsConditions.is_published ? '❌ 未發布 (is_published = false)' :
          !meetsConditions.has_submission ? '❌ 沒有提交記錄 (assignment_submissions)' :
          !meetsConditions.status_in_progress_or_completed ? `❌ 狀態不符合 (當前: ${submission?.status}, 需要: in_progress 或 completed)` :
          '✅ 應該可見'
        ) : '✅ 應該可見'
      };
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        email: student.email,
        name: student.user_metadata?.full_name || student.user_metadata?.name || '未設定'
      },
      stats: {
        totalProjectAssignments: allProjectAssignments?.length || 0,
        totalSubmissions: allSubmissions?.length || 0,
        projectSubmissions: projectSubmissions.length,
        visibleAssignments: detailedAnalysis.filter(a => a.shouldBeVisible).length
      },
      detailedAnalysis,
      rawData: {
        allProjectAssignments: allProjectAssignments?.map(a => ({
          id: a.id,
          title: a.title,
          is_project_assignment: a.is_project_assignment,
          is_published: a.is_published
        })),
        allSubmissions: allSubmissions?.map(s => ({
          id: s.id,
          assignment_id: s.assignment_id,
          status: s.status,
          created_at: s.created_at
        }))
      },
      debugInfo: {
        apiEndpoint: '/api/assignments/student',
        queryParams: `?student_id=${student.id}&status=in_progress,completed`,
        requiredConditions: [
          '1. is_project_assignment = true',
          '2. is_published = true',
          '3. 有 assignment_submissions 記錄 (INNER JOIN)',
          '4. submission.status IN (\'in_progress\', \'completed\')'
        ]
      }
    });

  } catch (error) {
    console.error('診斷失敗:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
