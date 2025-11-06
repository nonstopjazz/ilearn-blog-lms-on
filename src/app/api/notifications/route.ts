import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';

// 創建通知（僅限管理員或系統內部使用）
export async function POST(req: NextRequest) {
  try {
    // POST 使用 admin client，但需要驗證管理員權限
    const authSupabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    // 檢查是否為管理員
    const { data: userInfo } = await authSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userInfo?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '需要管理員權限' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const body = await req.json();
    const { user_id, title, message, type = 'info', action_url, action_text, metadata } = body;

    if (!user_id || !title || !message) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id,
        title,
        message,
        type,
        action_url,
        action_text,
        metadata,
        read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('創建通知失敗:', error);
      return NextResponse.json(
        { success: false, error: '創建通知失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: data
    });

  } catch (error) {
    console.error('通知 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

// 獲取通知列表（混合方案：驗證 + Admin Client）
export async function GET(req: NextRequest) {
  try {
    console.log('[Notifications API GET] 開始處理請求');
    console.log('[Notifications API GET] Cookies:', req.cookies.getAll().map(c => c.name));

    // 使用 server client 進行認證驗證
    const authSupabase = await createSupabaseServerClient();
    console.log('[Notifications API GET] Supabase client created');

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    console.log('[Notifications API GET] getUser result:', {
      hasUser: !!user,
      userId: user?.id,
      error: authError?.message
    });

    if (authError || !user) {
      console.error('[Notifications API] Auth failed:', authError);
      return NextResponse.json(
        { success: false, error: '未授權', debug: authError?.message },
        { status: 401 }
      );
    }

    // 使用 admin client 查詢（避免 RLS 問題，但有安全驗證）
    const adminSupabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data: notifications, error } = await adminSupabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)  // 使用認證用戶的 ID
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('獲取通知失敗:', error);
      return NextResponse.json(
        { success: false, error: '獲取通知失敗' },
        { status: 500 }
      );
    }

    console.log('[Notifications API] Success:', notifications?.length || 0, 'notifications');
    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error('獲取通知 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

// 更新通知狀態（混合方案：驗證 + Admin Client）
export async function PATCH(req: NextRequest) {
  try {
    // 使用 server client 進行認證驗證
    const authSupabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      console.error('[Notifications API] Auth failed:', authError);
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    const adminSupabase = createSupabaseAdminClient();
    const body = await req.json();
    const { notification_id, read, mark_all_read } = body;

    if (mark_all_read) {
      // 標記當前用戶所有通知為已讀
      const { error } = await adminSupabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)  // 只更新當前用戶的
        .eq('read', false);

      if (error) {
        console.error('批量更新通知失敗:', error);
        return NextResponse.json(
          { success: false, error: '更新失敗' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '所有通知已標記為已讀'
      });
    }

    if (!notification_id) {
      return NextResponse.json(
        { success: false, error: '缺少通知 ID' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof read === 'boolean') {
      updateData.read = read;
    }

    // 只能更新自己的通知
    const { data, error } = await adminSupabase
      .from('notifications')
      .update(updateData)
      .eq('id', notification_id)
      .eq('user_id', user.id)  // 確保是當前用戶的通知
      .select()
      .single();

    if (error) {
      console.error('更新通知失敗:', error);
      return NextResponse.json(
        { success: false, error: '更新通知失敗' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '找不到通知或無權限' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: data
    });

  } catch (error) {
    console.error('更新通知 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

// 刪除通知（混合方案：驗證 + Admin Client）
export async function DELETE(req: NextRequest) {
  try {
    // 使用 server client 進行認證驗證
    const authSupabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      console.error('[Notifications API] Auth failed:', authError);
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    const adminSupabase = createSupabaseAdminClient();
    const body = await req.json();
    const { notification_id } = body;

    if (!notification_id) {
      return NextResponse.json(
        { success: false, error: '缺少通知 ID' },
        { status: 400 }
      );
    }

    // 只能刪除自己的通知
    const { error } = await adminSupabase
      .from('notifications')
      .delete()
      .eq('id', notification_id)
      .eq('user_id', user.id);  // 確保是當前用戶的通知

    if (error) {
      console.error('刪除通知失敗:', error);
      return NextResponse.json(
        { success: false, error: '刪除通知失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '通知已刪除'
    });

  } catch (error) {
    console.error('刪除通知 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}