import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/stats
 * 獲取管理員儀表板統計數據（修正版）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    console.log('[Admin Stats API] 開始獲取統計數據...');

    // 並行獲取所有統計數據
    const [
      coursesResult,
      usersResult,
      courseRequestsResult,
      pendingRequestsResult,
      recentActivityResult
    ] = await Promise.all([
      // 1. 總課程數 - 從 course_lessons 獲取唯一課程
      supabase
        .from('course_lessons')
        .select('course_id', { count: 'exact', head: true }),

      // 2. 總用戶數（從 auth.users 獲取）
      supabase.auth.admin.listUsers(),

      // 3. 總學生數（已批准的課程申請）- 替代測驗數
      supabase
        .from('course_requests')
        .select('user_id', { count: 'exact', head: true })
        .eq('status', 'approved'),

      // 4. 待審核申請數
      supabase
        .from('course_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // 5. 最近活動（最近 10 筆記錄）
      supabase
        .from('course_requests')
        .select('id, course_id, user_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // 記錄錯誤詳情
    if (coursesResult.error) {
      console.error('[Admin Stats API] 課程查詢錯誤:', coursesResult.error);
    }
    if (usersResult.error) {
      console.error('[Admin Stats API] 用戶查詢錯誤:', usersResult.error);
    }
    if (courseRequestsResult.error) {
      console.error('[Admin Stats API] 課程申請查詢錯誤:', courseRequestsResult.error);
    }
    if (pendingRequestsResult.error) {
      console.error('[Admin Stats API] 待審核申請查詢錯誤:', pendingRequestsResult.error);
    }
    if (recentActivityResult.error) {
      console.error('[Admin Stats API] 最近活動查詢錯誤:', recentActivityResult.error);
    }

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
      totalQuizzes: courseRequestsResult.count || 0, // 暫時用學生數替代
      pendingRequests: pendingRequestsResult.count || 0,
      recentActivity
    };

    console.log('[Admin Stats API] 統計數據:', stats);

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
