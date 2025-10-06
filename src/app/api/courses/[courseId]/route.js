// src/app/api/courses/[courseId]/route.js
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// 獲取單一課程
export async function GET(request, { params }) {
  try {
    const supabase = createSupabaseAdminClient();
    const { courseId } = params;

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        lessons:course_lessons(*)
      `)
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('查詢課程失敗:', error);
      return Response.json({ 
        error: '查詢課程失敗：' + error.message 
      }, { status: 500 });
    }

    if (!course) {
      return Response.json({ 
        error: '課程不存在' 
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      course
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 更新課程
export async function PUT(request, { params }) {
  try {
    const supabase = createSupabaseAdminClient();
    const { courseId } = params;
    const updateData = await request.json();

    // 🔥 修復：只更新資料表實際存在的欄位
    const updateFields = {
      title: updateData.title,
      description: updateData.description,
      thumbnail_url: updateData.thumbnail_url,
      instructor_name: updateData.instructor_name,
      price: updateData.price,
      is_free: (updateData.price || 0) === 0,
      difficulty_level: updateData.level,
      category: updateData.category,
      status: updateData.status,
      updated_at: new Date().toISOString()
    };

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .update(updateFields)
      .eq('id', courseId)
      .select()
      .single();

    if (courseError) {
      console.error('更新課程失敗:', courseError);
      return Response.json({ 
        error: '更新課程失敗：' + courseError.message 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      course,
      message: '課程更新成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 刪除課程
export async function DELETE(request, { params }) {
  try {
    const supabase = createSupabaseAdminClient();
    const { courseId } = params;

    // 檢查是否有學員已註冊
    const { count: enrollmentCount } = await supabase
      .from('user_course_access')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (enrollmentCount && enrollmentCount > 0) {
      return Response.json({ 
        error: '無法刪除已有學員註冊的課程' 
      }, { status: 400 });
    }

    // 刪除相關的課程內容
    await supabase
      .from('course_lessons')
      .delete()
      .eq('course_id', courseId);

    // 刪除課程
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (deleteError) {
      console.error('刪除課程失敗:', deleteError);
      return Response.json({ 
        error: '刪除課程失敗：' + deleteError.message 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: '課程已刪除'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}