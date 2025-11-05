import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET - 獲取單個作文詳情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id: essayId } = await params;

    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    // 查詢作文
    const { data: essay, error } = await supabase
      .from('essay_submissions')
      .select('*')
      .eq('id', essayId)
      .single();

    if (error) {
      console.error('[Essay API] GET error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!essay) {
      return NextResponse.json(
        { success: false, error: '作文不存在' },
        { status: 404 }
      );
    }

    // 權限檢查：學生只能看自己的，管理員可以看所有
    const { data: userInfo } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userInfo?.role !== 'admin' && essay.student_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '無權訪問' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: essay
    });

  } catch (error: any) {
    console.error('[Essay API] GET exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - 更新作文
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id: essayId } = await params;

    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    // 獲取用戶角色
    const { data: userInfo } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userInfo?.role === 'admin';

    // 允許更新的欄位
    const allowedFields = [
      'essay_title',
      'student_notes',
      'tags',
      'status',
    ];

    // 管理員可以更新的額外欄位
    const adminFields = [
      'teacher_comment',
      'overall_comment',
      'score_content',
      'score_grammar',
      'score_structure',
      'score_vocabulary',
      'score_creativity',
      'annotations',
      'highlights',
      'essay_topic',
      'essay_topic_detail',
      'reviewed_at',
      'reviewed_by',
      'grade_level',
    ];

    const updateData: any = {};

    // 學生可以更新的欄位
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // 管理員可以更新的額外欄位
    if (isAdmin) {
      Object.keys(body).forEach(key => {
        if (adminFields.includes(key)) {
          updateData[key] = body[key];
        }
      });

      // 如果管理員評分，自動設置 reviewed_at 和 reviewed_by
      if (body.score_content !== undefined ||
          body.score_grammar !== undefined ||
          body.score_structure !== undefined ||
          body.score_vocabulary !== undefined ||
          body.score_creativity !== undefined) {
        updateData.reviewed_at = new Date().toISOString();
        updateData.reviewed_by = user.id;
        updateData.status = 'graded';
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: '沒有可更新的欄位' },
        { status: 400 }
      );
    }

    // 更新資料庫
    const { data: essay, error } = await supabase
      .from('essay_submissions')
      .update(updateData)
      .eq('id', essayId)
      .select()
      .single();

    if (error) {
      console.error('[Essay API] PATCH error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!essay) {
      return NextResponse.json(
        { success: false, error: '作文不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: essay,
      message: '更新成功'
    });

  } catch (error: any) {
    console.error('[Essay API] PATCH exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 刪除作文
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id: essayId } = await params;

    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      );
    }

    // 獲取作文資訊以刪除 Storage 中的圖片
    const { data: essay } = await supabase
      .from('essay_submissions')
      .select('image_url, image_thumbnail_url')
      .eq('id', essayId)
      .single();

    if (essay) {
      // 從 URL 提取檔案路徑
      const extractFilePath = (url: string) => {
        const match = url.match(/\/storage\/v1\/object\/public\/essays\/(.+)$/);
        return match ? match[1] : null;
      };

      // 刪除主圖片
      if (essay.image_url) {
        const filePath = extractFilePath(essay.image_url);
        if (filePath) {
          await supabase.storage.from('essays').remove([filePath]);
        }
      }

      // 刪除縮圖
      if (essay.image_thumbnail_url) {
        const thumbnailPath = extractFilePath(essay.image_thumbnail_url);
        if (thumbnailPath) {
          await supabase.storage.from('essays').remove([thumbnailPath]);
        }
      }
    }

    // 刪除資料庫記錄
    const { error } = await supabase
      .from('essay_submissions')
      .delete()
      .eq('id', essayId);

    if (error) {
      console.error('[Essay API] DELETE error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '刪除成功'
    });

  } catch (error: any) {
    console.error('[Essay API] DELETE exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
