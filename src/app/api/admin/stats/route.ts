import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/stats
 * 獲取管理員儀表板統計數據
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    // 並行獲取所有統計數據
    const [
      coursesResult,
      usersResult,
      quizzesResult,
      pendingRequestsResult,
      recentActivityResult
    ] = await Promise.all([
      // 1. 總課程數
      supabase.from('courses').select('id', { count: 'exact', head: true }),

      // 2. 總用戶數（從 auth.users 獲取）
      supabase.auth.admin.listUsers(),

      // 3. 總測驗數
      supabase.from('quizzes').select('id', { count: 'exact', head: true }),

      // 4. 待審核申請數
      supabase
        .from('course_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // 5. 最近活動（最近 10 筆記錄）
      supabase
        .from('course_applications')
        .select('id, course_id, user_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // 檢查錯誤
    if (coursesResult.error) throw coursesResult.error;
    if (usersResult.error) throw usersResult.error;
    if (quizzesResult.error) throw quizzesResult.error;
    if (pendingRequestsResult.error) throw pendingRequestsResult.error;
    if (recentActivityResult.error) throw recentActivityResult.error;

    // 格式化最近活動
    const recentActivity = recentActivityResult.data?.map((activity: any) => {
      const createdAt = new Date(activity.created_at);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeText = '';
      if (diffHours < 1) {
        timeText = '剛剛';
      } else if (diffHours < 24) {
        timeText = `${diffHours}小時前`;
      } else if (diffDays < 7) {
        timeText = `${diffDays}天前`;
      } else {
        timeText = createdAt.toLocaleDateString('zh-TW');
      }

      let title = '';
      let type = '';
      if (activity.status === 'pending') {
        title = '新課程申請';
        type = 'application';
      } else if (activity.status === 'approved') {
        title = '課程申請已通過';
        type = 'approval';
      } else if (activity.status === 'rejected') {
        title = '課程申請已拒絕';
        type = 'rejection';
      } else {
        title = '課程申請更新';
        type = 'update';
      }

      return {
        type,
        title,
        time: timeText,
        id: activity.id
      };
    }) || [];

    // 組合統計數據
    const stats = {
      totalCourses: coursesResult.count || 0,
      totalUsers: usersResult.data?.users?.length || 0,
      totalQuizzes: quizzesResult.count || 0,
      pendingRequests: pendingRequestsResult.count || 0,
      recentActivity
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: '成功獲取統計數據'
    });

  } catch (error) {
    console.error('[Admin Stats API] Error:', error);

    return NextResponse.json({
      success: false,
      error: '獲取統計數據失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
