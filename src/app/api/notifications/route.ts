import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 建立 Supabase 客戶端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 創建通知
export async function POST(req: NextRequest) {
  try {
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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶 ID' },
        { status: 400 }
      );
    }

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
    const body = await req.json();
    const { notification_id, user_id, read, mark_all_read } = body;

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
    const body = await req.json();
    const { notification_id } = body;

    if (!notification_id) {
      return NextResponse.json(
        { success: false, error: '缺少通知 ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification_id);

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