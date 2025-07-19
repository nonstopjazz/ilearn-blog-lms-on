// src/app/api/quiz/update/[id]/route.js
import { getSupabaseClient } from '@/lib/supabase-server';

export async function PUT(request, { params }) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ 
        error: 'Supabase 初始化失敗' 
      }, { status: 500 });
    }
    const { id } = params;
    
    if (!id) {
      return Response.json({ 
        error: '缺少測驗 ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    
    // 準備更新資料
    const updateData = {};
    
    // 只更新有提供的欄位
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.time_limit !== undefined) updateData.time_limit = body.time_limit;
    if (body.max_attempts !== undefined) updateData.max_attempts = body.max_attempts;
    if (body.passing_score !== undefined) updateData.passing_score = body.passing_score;
    if (body.randomize_questions !== undefined) updateData.randomize_questions = body.randomize_questions;
    if (body.show_results !== undefined) updateData.show_results = body.show_results;
    if (body.show_correct_answers !== undefined) updateData.show_correct_answers = body.show_correct_answers;
    if (body.available_from !== undefined) updateData.available_from = body.available_from;
    if (body.available_until !== undefined) updateData.available_until = body.available_until;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    // 加入更新時間
    updateData.updated_at = new Date().toISOString();

    // 執行更新
    const { data, error } = await supabase
      .from('quiz_sets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新測驗設定失敗:', error);
      return Response.json({ 
        error: '更新測驗設定失敗：' + error.message 
      }, { status: 500 });
    }

    if (!data) {
      return Response.json({ 
        error: '找不到指定的測驗' 
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      quiz: data,
      message: '測驗設定更新成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 也可以加入 DELETE 方法來刪除測驗
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return Response.json({ 
        error: '缺少測驗 ID' 
      }, { status: 400 });
    }

    // 先刪除相關的題目和選項（cascade delete）
    const { error: deleteError } = await supabase
      .from('quiz_sets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('刪除測驗失敗:', deleteError);
      return Response.json({ 
        error: '刪除測驗失敗：' + deleteError.message 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: '測驗刪除成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}