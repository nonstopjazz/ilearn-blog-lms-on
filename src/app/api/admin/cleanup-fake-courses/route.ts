import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// 刪除假課程資料的 API
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    console.log('=== 開始清理假課程資料 ===');

    const body = await req.json();
    const { user_id, fake_course_ids } = body;

    if (!user_id || !fake_course_ids || !Array.isArray(fake_course_ids)) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    console.log('用戶 ID:', user_id);
    console.log('要刪除的課程 ID:', fake_course_ids);

    // 1. 從 course_requests 表刪除
    const { data: deletedRequests, error: requestError } = await supabase
      .from('course_requests')
      .delete()
      .eq('user_id', user_id)
      .in('course_id', fake_course_ids)
      .select();

    if (requestError) {
      console.error('刪除 course_requests 失敗:', requestError);
      return NextResponse.json(
        { error: `刪除課程申請失敗: ${requestError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ 從 course_requests 刪除:', deletedRequests?.length || 0, '條記錄');

    // 2. 從 user_course_access 表刪除
    const { data: deletedAccess, error: accessError } = await supabase
      .from('user_course_access')
      .delete()
      .eq('user_id', user_id)
      .in('course_id', fake_course_ids)
      .select();

    if (accessError) {
      console.error('刪除 user_course_access 失敗:', accessError);
    } else {
      console.log('✅ 從 user_course_access 刪除:', deletedAccess?.length || 0, '條記錄');
    }

    console.log('=== 清理完成 ===');

    return NextResponse.json({
      success: true,
      deleted: {
        course_requests: deletedRequests?.length || 0,
        user_course_access: deletedAccess?.length || 0
      },
      message: `成功刪除 ${fake_course_ids.length} 門假課程`
    });

  } catch (error) {
    console.error('清理假課程 API 錯誤:', error);
    return NextResponse.json(
      { error: `伺服器內部錯誤: ${error.message}` },
      { status: 500 }
    );
  }
}
