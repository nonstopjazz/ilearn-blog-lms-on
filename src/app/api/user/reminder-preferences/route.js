import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// 檢查用戶認證
async function checkUserAuth(request) {
  try {
    const supabase = createSupabaseAdminClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { error: '缺少認證資訊', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: '認證失敗', status: 401 };
    }

    return { user };
  } catch (error) {
    return { error: '認證檢查失敗', status: 500 };
  }
}

// GET - 獲取用戶的提醒偏好設定
export async function GET(request) {
  try {
    const supabase = createSupabaseAdminClient();
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId) {
      return NextResponse.json({ error: '缺少用戶 ID' }, { status: 400 });
    }

    // 檢查用戶認證
    const authResult = await checkUserAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // 確保只能查看自己的設定
    if (authResult.user.id !== userId) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    // 查詢管理員設定的提醒規則
    let adminQuery = supabase
      .from('admin_course_reminders')
      .select(`
        *,
        courses (
          id,
          title
        )
      `)
      .eq('is_enabled', true);

    if (courseId) {
      adminQuery = adminQuery.eq('course_id', courseId);
    }

    const { data: adminReminders, error: adminError } = await adminQuery;

    if (adminError) {
      console.error('查詢管理員提醒設定錯誤:', adminError);
      return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }

    // 查詢用戶的個人偏好設定
    let userQuery = supabase
      .from('user_reminder_preferences')
      .select('*')
      .eq('user_id', userId);

    if (courseId) {
      userQuery = userQuery.eq('course_id', courseId);
    }

    const { data: userPreferences, error: userError } = await userQuery;

    if (userError) {
      console.error('查詢用戶偏好設定錯誤:', userError);
      return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }

    // 合併管理員設定和用戶偏好
    const combinedSettings = adminReminders.map(adminReminder => {
      const userPref = userPreferences?.find(
        pref => pref.course_id === adminReminder.course_id && 
                pref.reminder_type === adminReminder.reminder_type
      );

      return {
        ...adminReminder,
        user_enabled: userPref ? userPref.is_enabled : true, // 預設開啟
        user_preference_id: userPref?.id || null
      };
    });

    return NextResponse.json({
      success: true,
      data: combinedSettings
    });

  } catch (error) {
    console.error('GET /api/user/reminder-preferences 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// POST - 更新用戶提醒偏好
export async function POST(request) {
  try {
    const supabase = createSupabaseAdminClient();
    }
    const authResult = await checkUserAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const {
      userId,
      courseId,
      reminderType,
      isEnabled
    } = body;

    if (!userId || !courseId || !reminderType) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 確保只能修改自己的設定
    if (authResult.user.id !== userId) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    // 檢查管理員是否有設定這個提醒
    const { data: adminReminder } = await supabase
      .from('admin_course_reminders')
      .select('id')
      .eq('course_id', courseId)
      .eq('reminder_type', reminderType)
      .eq('is_enabled', true)
      .single();

    if (!adminReminder) {
      return NextResponse.json({ error: '找不到對應的管理員提醒設定' }, { status: 404 });
    }

    const preferenceData = {
      user_id: userId,
      course_id: courseId,
      reminder_type: reminderType,
      is_enabled: isEnabled,
      updated_at: new Date().toISOString()
    };

    // 檢查是否已存在偏好設定
    const { data: existing } = await supabase
      .from('user_reminder_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('reminder_type', reminderType)
      .single();

    let result;
    
    if (existing) {
      // 更新現有偏好
      result = await supabase
        .from('user_reminder_preferences')
        .update(preferenceData)
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('reminder_type', reminderType)
        .select()
        .single();
    } else {
      // 建立新偏好
      preferenceData.created_at = new Date().toISOString();
      result = await supabase
        .from('user_reminder_preferences')
        .insert([preferenceData])
        .select()
        .single();
    }

    if (result.error) {
      console.error('儲存用戶偏好錯誤:', result.error);
      return NextResponse.json({ error: '儲存失敗' }, { status: 500 });
    }

    // 建立系統通知
    await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: 'success',
        title: '提醒設定已更新',
        message: `您已${isEnabled ? '開啟' : '關閉'}課程提醒`,
        action_url: `/courses/${courseId}`,
        created_at: new Date().toISOString()
      }]);

    return NextResponse.json({
      success: true,
      message: '提醒偏好已更新',
      data: result.data
    });

  } catch (error) {
    console.error('POST /api/user/reminder-preferences 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// PUT - 批量更新用戶的提醒偏好
export async function PUT(request) {
  try {
    const supabase = createSupabaseAdminClient();
    }
    const authResult = await checkUserAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId || !preferences || !Array.isArray(preferences)) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 確保只能修改自己的設定
    if (authResult.user.id !== userId) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const results = [];
    const errors = [];

    for (const pref of preferences) {
      try {
        const { courseId, reminderType, isEnabled } = pref;

        if (!courseId || !reminderType) {
          errors.push('缺少課程ID或提醒類型');
          continue;
        }

        const preferenceData = {
          user_id: userId,
          course_id: courseId,
          reminder_type: reminderType,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString()
        };

        // 使用 upsert
        const { data, error } = await supabase
          .from('user_reminder_preferences')
          .upsert([preferenceData], {
            onConflict: 'user_id,course_id,reminder_type',
            returning: 'minimal'
          });

        if (error) {
          errors.push(`${courseId}-${reminderType}: ${error.message}`);
        } else {
          results.push(`${courseId}-${reminderType}`);
        }

      } catch (error) {
        errors.push(`處理偏好設定時出錯: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      message: `已更新 ${results.length} 項偏好設定`,
      data: { updated: results, errors: errors }
    });

  } catch (error) {
    console.error('PUT /api/user/reminder-preferences 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}