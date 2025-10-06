import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET - 獲取用戶特定課程的提醒設定
export async function GET(request) {
  try {
    const supabase = createSupabaseAdminClient();, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId || !courseId) {
      return NextResponse.json({ error: '缺少用戶 ID 或課程 ID' }, { status: 400 });
    }

    // 查詢該用戶在該課程的所有提醒設定
    const { data: reminders, error } = await supabase
      .from('learning_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      console.error('查詢提醒設定錯誤:', error);
      return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: reminders || []
    });

  } catch (error) {
    console.error('GET /api/learning-reminders 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// POST - 建立或更新特定課程的提醒設定
export async function POST(request) {
  try {
    const supabase = createSupabaseAdminClient();, { status: 500 });
    }
    const body = await request.json();
    const {
      userId,
      courseId,
      reminderType,
      isEnabled,
      emailEnabled,
      pushEnabled,
      frequency,
      preferredTime
    } = body;

    if (!userId || !courseId || !reminderType) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    const reminderData = {
      user_id: userId,
      course_id: courseId,
      reminder_type: reminderType,
      is_enabled: isEnabled,
      email_enabled: emailEnabled,
      push_enabled: pushEnabled || false,
      frequency: frequency || 'weekly',
      preferred_time: preferredTime || '09:00:00',
      updated_at: new Date().toISOString()
    };

    // 檢查是否已存在設定 (利用複合唯一鍵)
    const { data: existing } = await supabase
      .from('learning_reminders')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('reminder_type', reminderType)
      .single();

    let result;
    
    if (existing) {
      // 更新現有設定
      result = await supabase
        .from('learning_reminders')
        .update(reminderData)
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('reminder_type', reminderType)
        .select()
        .single();
    } else {
      // 建立新設定
      reminderData.created_at = new Date().toISOString();
      result = await supabase
        .from('learning_reminders')
        .insert([reminderData])
        .select()
        .single();
    }

    if (result.error) {
      console.error('儲存提醒設定錯誤:', result.error);
      return NextResponse.json({ error: '儲存失敗' }, { status: 500 });
    }

    // 建立系統通知
    await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: 'success',
        title: '提醒設定已更新',
        message: `課程提醒設定已成功更新`,
        action_url: `/courses/${courseId}`,
        created_at: new Date().toISOString()
      }]);

    return NextResponse.json({
      success: true,
      message: '提醒設定已更新',
      data: result.data
    });

  } catch (error) {
    console.error('POST /api/learning-reminders 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// DELETE - 刪除特定課程的提醒設定
export async function DELETE(request) {
  try {
    const supabase = createSupabaseAdminClient();, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const reminderType = searchParams.get('reminderType');

    if (!userId || !courseId) {
      return NextResponse.json({ error: '缺少用戶 ID 或課程 ID' }, { status: 400 });
    }

    let query = supabase
      .from('learning_reminders')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    // 如果指定提醒類型，只刪除該類型
    if (reminderType) {
      query = query.eq('reminder_type', reminderType);
    }

    const { error } = await query;

    if (error) {
      console.error('刪除提醒設定錯誤:', error);
      return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '提醒設定已刪除'
    });

  } catch (error) {
    console.error('DELETE /api/learning-reminders 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}