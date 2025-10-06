import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 延遲初始化 Supabase 客戶端
function createSupabaseAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// 🔧 修復：改進的管理員權限檢查
async function checkAdminPermission(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    console.log('=== 權限檢查開始 ===');
    console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('❌ 缺少認證標頭');
      return { error: '缺少認證資訊', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token 長度:', token.length);
    console.log('Token 開始:', token.substring(0, 50) + '...');

    // 🔧 修復：使用客戶端 supabase 來驗證 token
    const supabase = createSupabaseAdminClient();

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    console.log('Supabase 用戶查詢結果:');
    console.log('- Error:', error);
    console.log('- User:', user ? { id: user.id, email: user.email } : 'null');
    
    if (error) {
      console.log('❌ Supabase 認證錯誤:', error.message);
      return { error: '認證失敗: ' + error.message, status: 401 };
    }

    if (!user) {
      console.log('❌ 無用戶資訊');
      return { error: '認證失敗：無效的 token', status: 401 };
    }

    console.log('✅ 用戶認證成功:', user.email);

    // 🔧 修復：更寬鬆的管理員檢查
    const adminEmails = [
      'nonstopjazz@gmail.com',
      'admin@example.com'
    ];

    const isAdmin = 
      adminEmails.includes(user.email) ||
      user.user_metadata?.role === 'admin' || 
      user.app_metadata?.role === 'admin' ||
      user.email?.includes('admin') || 
      user.id === '36258aeb-f26d-406e-a8ed-25595a736614';

    console.log('管理員檢查結果:');
    console.log('- Email:', user.email);
    console.log('- 是否在管理員列表:', adminEmails.includes(user.email));
    console.log('- user_metadata.role:', user.user_metadata?.role);
    console.log('- app_metadata.role:', user.app_metadata?.role);
    console.log('- 最終結果:', isAdmin);

    if (!isAdmin) {
      console.log('❌ 權限不足');
      return { error: '權限不足：需要管理員權限', status: 403 };
    }

    console.log('✅ 管理員權限驗證成功');
    console.log('=== 權限檢查結束 ===');

    return { user, isAdmin: true };
  } catch (error) {
    console.error('💥 權限檢查異常:', error);
    return { error: '權限檢查失敗: ' + error.message, status: 500 };
  }
}

// GET - 獲取所有課程的提醒設定
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    console.log('=== GET /api/admin/course-reminders ===');
    console.log('Course ID:', courseId);

    // 檢查管理員權限
    const authResult = await checkAdminPermission(request);
    if (authResult.error) {
      console.log('❌ 權限檢查失敗:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    console.log('✅ 權限檢查通過，開始查詢提醒設定...');

    const supabase = createSupabaseAdminClient();, { status: 500 });
    }

    let query = supabase
      .from('admin_course_reminders')
      .select(`
        *,
        courses (
          id,
          title
        )
      `)
      .order('course_id')
      .order('reminder_type');

    // 如果指定課程，只查詢該課程
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: reminders, error } = await query;

    if (error) {
      console.error('❌ 查詢提醒設定錯誤:', error);
      return NextResponse.json({ error: '查詢失敗: ' + error.message }, { status: 500 });
    }

    console.log('✅ 查詢成功，找到', reminders?.length || 0, '個提醒設定');

    return NextResponse.json({
      success: true,
      data: reminders || []
    });

  } catch (error) {
    console.error('💥 GET /api/admin/course-reminders 異常:', error);
    return NextResponse.json({ error: '伺服器錯誤: ' + error.message }, { status: 500 });
  }
}

// POST - 建立或更新課程提醒設定
export async function POST(request) {
  try {
    console.log('=== POST /api/admin/course-reminders ===');

    const authResult = await checkAdminPermission(request);
    if (authResult.error) {
      console.log('❌ 權限檢查失敗:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    console.log('📥 收到的資料:', body);

    const {
      courseId,
      reminderType,
      isEnabled,
      triggerCondition,
      messageTemplate,
      frequency,
      preferredTime,
      emailEnabled,
      pushEnabled,
      inAppEnabled
    } = body;

    if (!courseId || !reminderType) {
      console.log('❌ 缺少必要參數');
      return NextResponse.json({ error: '缺少必要參數：courseId 和 reminderType' }, { status: 400 });
    }

    const reminderData = {
      course_id: courseId,
      reminder_type: reminderType,
      is_enabled: isEnabled !== undefined ? isEnabled : true,
      trigger_condition: triggerCondition || {},
      message_template: messageTemplate || '',
      frequency: frequency || 'once',
      preferred_time: preferredTime || '09:00',
      email_enabled: emailEnabled !== undefined ? emailEnabled : true,
      push_enabled: pushEnabled !== undefined ? pushEnabled : false,
      in_app_enabled: inAppEnabled !== undefined ? inAppEnabled : true,
      created_by: authResult.user.id,
      updated_at: new Date().toISOString()
    };

    console.log('💾 準備儲存的資料:', reminderData);

    const supabase = createSupabaseAdminClient();, { status: 500 });
    }

    // 檢查是否已存在設定
    const { data: existing, error: checkError } = await supabase
      .from('admin_course_reminders')
      .select('id')
      .eq('course_id', courseId)
      .eq('reminder_type', reminderType)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ 檢查現有設定失敗:', checkError);
      return NextResponse.json({ error: '檢查現有設定失敗' }, { status: 500 });
    }

    let result;
    
    if (existing) {
      console.log('🔄 更新現有設定...');
      result = await supabase
        .from('admin_course_reminders')
        .update(reminderData)
        .eq('course_id', courseId)
        .eq('reminder_type', reminderType)
        .select()
        .single();
    } else {
      console.log('➕ 建立新設定...');
      reminderData.created_at = new Date().toISOString();
      result = await supabase
        .from('admin_course_reminders')
        .insert([reminderData])
        .select()
        .single();
    }

    if (result.error) {
      console.error('❌ 儲存提醒設定錯誤:', result.error);
      return NextResponse.json({ error: '儲存失敗: ' + result.error.message }, { status: 500 });
    }

    console.log('✅ 提醒設定儲存成功');

    return NextResponse.json({
      success: true,
      message: '提醒設定已更新',
      data: result.data
    });

  } catch (error) {
    console.error('💥 POST /api/admin/course-reminders 異常:', error);
    return NextResponse.json({ error: '伺服器錯誤: ' + error.message }, { status: 500 });
  }
}

// DELETE - 刪除提醒設定
export async function DELETE(request) {
  try {
    console.log('=== DELETE /api/admin/course-reminders ===');

    const authResult = await checkAdminPermission(request);
    if (authResult.error) {
      console.log('❌ 權限檢查失敗:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const reminderType = searchParams.get('reminderType');

    console.log('🗑️ 刪除參數:', { courseId, reminderType });

    if (!courseId || !reminderType) {
      console.log('❌ 缺少必要參數');
      return NextResponse.json({ error: '缺少必要參數：courseId 和 reminderType' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();, { status: 500 });
    }

    const { error } = await supabase
      .from('admin_course_reminders')
      .delete()
      .eq('course_id', courseId)
      .eq('reminder_type', reminderType);

    if (error) {
      console.error('❌ 刪除提醒設定錯誤:', error);
      return NextResponse.json({ error: '刪除失敗: ' + error.message }, { status: 500 });
    }

    console.log('✅ 提醒設定刪除成功');

    return NextResponse.json({
      success: true,
      message: '提醒設定已刪除'
    });

  } catch (error) {
    console.error('💥 DELETE /api/admin/course-reminders 異常:', error);
    return NextResponse.json({ error: '伺服器錯誤: ' + error.message }, { status: 500 });
  }
}

// PUT - 批量更新多個課程的提醒設定
export async function PUT(request) {
  try {
    console.log('=== PUT /api/admin/course-reminders ===');

    const authResult = await checkAdminPermission(request);
    if (authResult.error) {
      console.log('❌ 權限檢查失敗:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { courseIds, reminderType, settings } = body;

    console.log('📥 批量更新資料:', { courseIds, reminderType, settings });

    if (!courseIds || !Array.isArray(courseIds) || !reminderType || !settings) {
      console.log('❌ 缺少必要參數');
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    const supabase = createSupabaseAdminClient();, { status: 500 });
    }

    for (const courseId of courseIds) {
      try {
        const reminderData = {
          course_id: courseId,
          reminder_type: reminderType,
          ...settings,
          created_by: authResult.user.id,
          updated_at: new Date().toISOString()
        };

        // 使用 upsert 功能
        const { data, error } = await supabase
          .from('admin_course_reminders')
          .upsert([reminderData], { 
            onConflict: 'course_id,reminder_type',
            returning: 'minimal'
          });

        if (error) {
          errors.push(`課程 ${courseId}: ${error.message}`);
        } else {
          results.push(courseId);
        }

      } catch (error) {
        errors.push(`課程 ${courseId}: ${error.message}`);
      }
    }

    console.log('✅ 批量更新完成，成功:', results.length, '失敗:', errors.length);

    return NextResponse.json({
      success: results.length > 0,
      message: `已更新 ${results.length} 門課程的設定`,
      data: { updated: results, errors: errors }
    });

  } catch (error) {
    console.error('💥 PUT /api/admin/course-reminders 異常:', error);
    return NextResponse.json({ error: '伺服器錯誤: ' + error.message }, { status: 500 });
  }
}