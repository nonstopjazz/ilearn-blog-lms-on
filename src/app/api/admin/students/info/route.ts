import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET - 取得學生資訊（僅 admin 可用）
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'student_id is required' },
        { status: 400 }
      );
    }

    // 檢查當前用戶是否是 admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 檢查用戶角色
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    // 使用 service role 查詢學生資料（繞過 RLS）
    const { data: studentInfo, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('[Admin Students Info API] Query error:', error);
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

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
