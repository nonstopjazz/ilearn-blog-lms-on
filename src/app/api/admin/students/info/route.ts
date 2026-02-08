import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// 檢查用戶認證
async function checkUserAuth(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { error: 'Missing authorization header', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('[Admin Students Info API] Auth error:', error);
      return { error: 'Authentication failed', status: 401 };
    }

    return { user };
  } catch (error) {
    console.error('[Admin Students Info API] Auth check error:', error);
    return { error: 'Authentication check failed', status: 500 };
  }
}

// GET - 取得學生資訊（僅 admin 可用）
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    console.log('[Admin Students Info API] Request for student_id:', studentId);

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'student_id is required' },
        { status: 400 }
      );
    }

    // 檢查當前用戶是否已認證
    const authResult = await checkUserAuth(request);
    if (authResult.error) {
      console.log('[Admin Students Info API] Auth failed:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    // 檢查用戶角色
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[Admin Students Info API] User role:', profile?.role, 'Error:', profileError);

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    // 使用 service role 查詢學生資料（繞過 RLS）
    // 先嘗試從 users 表查詢
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', studentId)
      .single();

    console.log('[Admin Students Info API] User table query result:', userInfo, 'Error:', userError);

    // 如果 users 表有完整資料，直接返回
    if (!userError && userInfo) {
      return NextResponse.json({
        success: true,
        data: userInfo
      });
    }

    // 如果 users 表沒有或資料不完整，從 course_requests 查詢
    console.log('[Admin Students Info API] Trying course_requests table...');

    const { data: courseRequest, error: requestError } = await supabase
      .from('course_requests')
      .select('user_id, user_info')
      .eq('user_id', studentId)
      .eq('status', 'approved')
      .limit(1)
      .single();

    console.log('[Admin Students Info API] Course request query result:', courseRequest, 'Error:', requestError);

    if (requestError || !courseRequest) {
      console.error('[Admin Students Info API] Student not found in both tables');
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // 從 course_requests.user_info 提取學生資料
    const studentInfo = {
      id: courseRequest.user_id,
      name: courseRequest.user_info?.name || '未知學生',
      email: courseRequest.user_info?.email || 'no-email@example.com',
      role: 'student' // course_requests 中的都是學生
    };

    console.log('[Admin Students Info API] Final student info:', studentInfo);

    return NextResponse.json({
      success: true,
      data: studentInfo
    });

  } catch (error: any) {
    console.error('[Admin Students Info API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
