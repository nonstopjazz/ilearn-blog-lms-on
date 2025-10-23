import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// GET - 診斷工具：查看最近建立的作業
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = createSupabaseAdminClient();

    // 查詢最近建立的作業（不限制 is_project_assignment）
    const { data: recentAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        is_project_assignment,
        is_published,
        created_at,
        assignment_submissions (
          id,
          student_id,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (assignmentsError) {
      throw assignmentsError;
    }

    // 統計資訊
    const stats = {
      total: recentAssignments?.length || 0,
      projectAssignments: recentAssignments?.filter(a => a.is_project_assignment).length || 0,
      normalAssignments: recentAssignments?.filter(a => !a.is_project_assignment).length || 0,
      published: recentAssignments?.filter(a => a.is_published).length || 0,
      unpublished: recentAssignments?.filter(a => !a.is_published).length || 0,
      withSubmissions: recentAssignments?.filter(a => a.assignment_submissions && a.assignment_submissions.length > 0).length || 0,
      withoutSubmissions: recentAssignments?.filter(a => !a.assignment_submissions || a.assignment_submissions.length === 0).length || 0
    };

    return NextResponse.json({
      success: true,
      message: `查詢最近 ${limit} 筆作業`,
      stats: stats,
      data: recentAssignments,
      debugInfo: {
        tip: '如果看到作業但前端沒顯示，請檢查：',
        checks: [
          '1. is_project_assignment 是否為 true',
          '2. 是否有 assignment_submissions 記錄',
          '3. assignment_submissions 的 status 是否為 in_progress 或 completed（學生端）'
        ]
      }
    });

  } catch (error) {
    console.error('診斷失敗:', error);

    return NextResponse.json({
      success: false,
      error: '診斷失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
