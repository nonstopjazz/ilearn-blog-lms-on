import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    // 嘗試查詢 assignments 表
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      return NextResponse.json({
        success: false,
        error: 'assignments 表查詢失敗',
        details: assignmentsError.message,
        code: assignmentsError.code,
        hint: assignmentsError.hint,
        tableExists: assignmentsError.code === '42P01' ? false : 'unknown'
      }, { status: 500 });
    }

    // 計算總記錄數
    const { count, error: countError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      tableExists: true,
      totalRecords: count || 0,
      recentRecords: assignmentsData || [],
      message: `assignments 表存在，共 ${count || 0} 筆記錄`
    });

  } catch (error) {
    console.error('檢查 assignments 表錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
