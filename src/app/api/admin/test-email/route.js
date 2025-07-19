import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/emailService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 檢查管理員權限
async function checkAdminPermission(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { error: '缺少認證資訊', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: '認證失敗', status: 401 };
    }

    const isAdmin = user.user_metadata?.role === 'admin' || 
                   user.email?.includes('admin') || 
                   user.id === '36258aeb-f26d-406e-a8ed-25595a736614';

    if (!isAdmin) {
      return { error: '權限不足', status: 403 };
    }

    return { user, isAdmin: true };
  } catch (error) {
    return { error: '權限檢查失敗', status: 500 };
  }
}

// POST - 發送測試 Email
export async function POST(request) {
  try {
    const authResult = await checkAdminPermission(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { email, reminderType = 'PROGRESS_REMINDER' } = body;

    if (!email) {
      return NextResponse.json({ error: '請提供 Email 地址' }, { status: 400 });
    }

    // 驗證 Email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email 格式不正確' }, { status: 400 });
    }

    // 準備測試變數
    const testVariables = {
      user_name: '測試用戶',
      course_title: '測試課程 - Next.js 完整開發指南',
      custom_message: '這是一封測試郵件，用於驗證 Email 發送功能是否正常運作。如果您收到這封郵件，表示 Resend 整合成功！',
      course_url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses/course_001`,
      preferences_url: `${process.env.NEXT_PUBLIC_SITE_URL}/user/reminder-preferences`
    };

    // 發送測試 Email
    const result = await sendTestEmail(email);

    if (result.success) {
      // 記錄測試發送
      await supabase
        .from('reminder_logs')
        .insert([{
          user_id: authResult.user.id,
          course_id: 'test',
          reminder_type: 'test',
          delivery_method: 'email',
          status: 'sent',
          subject: '測試 Email - iLearn 線上課程平台',
          message: '測試郵件發送成功',
          trigger_data: { test: true, email: email },
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }]);

      return NextResponse.json({
        success: true,
        message: `測試 Email 已成功發送到 ${email}`,
        data: {
          email: email,
          reminderType: reminderType,
          resendId: result.data?.id || null
        }
      });
    } else {
      // 記錄測試失敗
      await supabase
        .from('reminder_logs')
        .insert([{
          user_id: authResult.user.id,
          course_id: 'test',
          reminder_type: 'test',
          delivery_method: 'email',
          status: 'failed',
          subject: '測試 Email - iLearn 線上課程平台',
          message: '測試郵件發送失敗',
          trigger_data: { test: true, email: email },
          error_message: result.error,
          created_at: new Date().toISOString()
        }]);

      return NextResponse.json({
        success: false,
        error: `測試 Email 發送失敗: ${result.error}`,
        data: {
          email: email,
          reminderType: reminderType
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('POST /api/admin/test-email 錯誤:', error);
    return NextResponse.json({ 
      success: false,
      error: '伺服器錯誤',
      details: error.message 
    }, { status: 500 });
  }
}

// GET - 檢查 Email 服務狀態
export async function GET(request) {
  try {
    const authResult = await checkAdminPermission(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // 檢查環境變數
    const requiredEnvVars = {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      FROM_EMAIL: process.env.FROM_EMAIL,
      FROM_NAME: process.env.FROM_NAME,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
    };

    const missingVars = [];
    const configStatus = {};

    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        missingVars.push(key);
        configStatus[key] = '未設定';
      } else {
        configStatus[key] = key === 'RESEND_API_KEY' ? '已設定 (隱藏)' : value;
      }
    }

    // 檢查最近的 Email 發送記錄
    const { data: recentLogs, error } = await supabase
      .from('reminder_logs')
      .select('*')
      .eq('delivery_method', 'email')
      .order('created_at', { ascending: false })
      .limit(5);

    const emailStats = {
      total: 0,
      sent: 0,
      failed: 0,
      recentLogs: recentLogs || []
    };

    if (recentLogs) {
      emailStats.total = recentLogs.length;
      emailStats.sent = recentLogs.filter(log => log.status === 'sent').length;
      emailStats.failed = recentLogs.filter(log => log.status === 'failed').length;
    }

    return NextResponse.json({
      success: true,
      data: {
        configStatus: configStatus,
        missingVars: missingVars,
        isConfigured: missingVars.length === 0,
        emailStats: emailStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('GET /api/admin/test-email 錯誤:', error);
    return NextResponse.json({ 
      success: false,
      error: '伺服器錯誤',
      details: error.message 
    }, { status: 500 });
  }
}