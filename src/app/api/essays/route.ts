import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { isAdmin } from '@/lib/security-config';

// GET - 獲取作文列表（使用 Admin Client 繞過認證問題）
export async function GET(request: NextRequest) {
  try {
    const { user: authUser } = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const searchParams = request.nextUrl.searchParams;

    // 獲取查詢參數
    const studentId = searchParams.get('student_id');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');

    // 建立查詢
    let query = supabase
      .from('essay_submissions')
      .select('*');

    // 使用 isAdmin 檢查管理員權限（不依賴 users 表）
    if (!isAdmin(authUser)) {
      // 學生只能看自己的作文
      query = query.eq('student_id', authUser.id);
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

// POST - 建立新的作文提交記錄（使用 Admin Client）
export async function POST(request: NextRequest) {
  try {
    const { user: authUser } = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const body = await request.json();

    // 使用認證用戶的 ID
    const userId = authUser.id;

    // 提交類型驗證
    const submissionType = body.submission_type || 'image';
    if (!['image', 'text'].includes(submissionType)) {
      return NextResponse.json(
        { success: false, error: '無效的提交類型' },
        { status: 400 }
      );
    }

    // 根據提交類型驗證必填欄位
    if (submissionType === 'image') {
      if (!body.image_url || !body.file_name) {
        return NextResponse.json(
          { success: false, error: '圖片提交需要 image_url 和 file_name' },
          { status: 400 }
        );
      }
    } else if (submissionType === 'text') {
      if (!body.essay_content || !body.essay_content.trim()) {
        return NextResponse.json(
          { success: false, error: '文字提交需要 essay_content' },
          { status: 400 }
        );
      }
    }

    // 準備插入的資料
    const essayData: any = {
      student_id: userId,
      submission_type: submissionType,
      essay_title: body.essay_title || '未命名作文',
      essay_date: body.essay_date || new Date().toISOString().split('T')[0],
      student_notes: body.student_notes || null,
      tags: body.tags || [],
      status: body.status || 'submitted',
      task_id: body.task_id || null,
    };

    // 圖片提交的額外欄位
    if (submissionType === 'image') {
      essayData.image_url = body.image_url;
      essayData.file_name = body.file_name;
      essayData.original_file_size = body.original_file_size;
      essayData.compressed_file_size = body.compressed_file_size;
      essayData.mime_type = body.mime_type;
      essayData.image_width = body.image_width;
      essayData.image_height = body.image_height;

      // 如果有縮圖 URL
      if (body.image_thumbnail_url) {
        essayData.image_thumbnail_url = body.image_thumbnail_url;
      }
    }

    // 文字提交的額外欄位
    if (submissionType === 'text') {
      essayData.essay_content = body.essay_content;
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
