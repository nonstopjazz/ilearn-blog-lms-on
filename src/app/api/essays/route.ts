import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET - 獲取作文列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;

    // 獲取查詢參數
    const studentId = searchParams.get('student_id');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');

    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    // 建立查詢
    let query = supabase
      .from('essay_submissions')
      .select('*');

    // 如果是學生，只能看自己的作文
    const { data: userInfo } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userInfo?.role !== 'admin') {
      query = query.eq('student_id', user.id);
    } else if (studentId) {
      // 管理員可以查詢特定學生的作文
      query = query.eq('student_id', studentId);
    }

    // 狀態篩選
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 排序
    query = query.order(sortBy, { ascending: order === 'asc' });

    // 限制數量
    query = query.limit(limit);

    const { data: essays, error } = await query;

    if (error) {
      console.error('[Essays API] GET error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: essays || [],
      count: essays?.length || 0
    });

  } catch (error: any) {
    console.error('[Essays API] GET exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 建立新的作文提交記錄
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    // 必填欄位驗證
    if (!body.image_url || !body.file_name) {
      return NextResponse.json(
        { success: false, error: '缺少必填欄位' },
        { status: 400 }
      );
    }

    // 準備插入的資料
    const essayData: any = {
      student_id: user.id,
      image_url: body.image_url,
      file_name: body.file_name,
      original_file_size: body.original_file_size,
      compressed_file_size: body.compressed_file_size,
      mime_type: body.mime_type,
      image_width: body.image_width,
      image_height: body.image_height,
      essay_title: body.essay_title || '未命名作文',
      essay_date: body.essay_date || new Date().toISOString().split('T')[0],
      student_notes: body.student_notes || null,
      tags: body.tags || [],
      status: body.status || 'submitted',
      task_id: body.task_id || null,
    };

    // 如果有縮圖 URL
    if (body.image_thumbnail_url) {
      essayData.image_thumbnail_url = body.image_thumbnail_url;
    }

    // 插入資料庫
    const { data: essay, error } = await supabase
      .from('essay_submissions')
      .insert(essayData)
      .select()
      .single();

    if (error) {
      console.error('[Essays API] POST error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: essay,
      message: '作文提交成功'
    });

  } catch (error: any) {
    console.error('[Essays API] POST exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
