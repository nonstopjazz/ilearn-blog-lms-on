import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { ApiResponse } from '@/types/learning-management';

// GET - 獲取所有專案作業模板
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: templates, error } = await supabase
      .from('project_assignment_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('獲取專案模板失敗:', error);
      throw error;
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: templates || [],
      message: `成功獲取 ${templates?.length || 0} 個專案模板`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('獲取專案模板失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '獲取專案模板失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST - 建立新的專案作業模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateName, description, assignments, tags, targetAudience } = body;

    if (!templateName || !assignments || assignments.length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位',
        message: '需要提供模板名稱和至少一個作業'
      }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('project_assignment_templates')
      .insert({
        template_name: templateName,
        description: description,
        assignments: assignments,
        tags: tags || [],
        target_audience: targetAudience
      })
      .select()
      .single();

    if (error) {
      console.error('建立專案模板失敗:', error);
      throw error;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: data,
      message: '成功建立專案模板'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('建立專案模板失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '建立專案模板失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
