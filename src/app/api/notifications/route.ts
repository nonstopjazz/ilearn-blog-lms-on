import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';

// 創建通知（僅限管理員使用）
export async function POST(req: NextRequest) {
  try {
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

// 獲取通知列表
export async function GET(req: NextRequest) {
  try {
    // 認證檢查
    const { user: authUser } = await authenticateRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // 強制只能查詢自己的通知（修復 IDOR）
    const userId = authUser.id;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('獲取通知失敗:', error);
      return NextResponse.json(
        { success: false, error: '獲取通知失敗' },
        { status: 500 }
      );
    }

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

// 更新通知狀態
export async function PATCH(req: NextRequest) {
  try {
    // 認證檢查
    const { user: authUser } = await authenticateRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const body = await req.json();
    const { notification_id, read, mark_all_read } = body;
    // 強制使用認證用戶的 ID
    const user_id = authUser.id;

    if (mark_all_read && user_id) {
      // 標記用戶所有通知為已讀
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user_id)
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

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notification_id)
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

// 刪除通知
export async function DELETE(req: NextRequest) {
  try {
    // 認證檢查
    const { user: authUser } = await authenticateRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const body = await req.json();
    const { notification_id } = body;

    if (!notification_id) {
      return NextResponse.json(
        { success: false, error: '缺少通知 ID' },
        { status: 400 }
      );
    }

    // 只能刪除自己的通知
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification_id)
      .eq('user_id', authUser.id);

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