// src/app/api/quiz/attempt/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { quiz_set_id, started_at, user_id } = await request.json();
    
    if (!quiz_set_id || !started_at) {
      return Response.json({ 
        error: '缺少必要欄位' 
      }, { status: 400 });
    }

    // 🔧 使用正確的欄位名稱
    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_set_id: quiz_set_id,
        user_id: user_id || null, // 使用傳入的 user_id
        started_at: started_at,
        status: 'in_progress'
        // created_at 會自動設置
      })
      .select()
      .single();

    if (error) {
      console.error('建立測驗嘗試記錄失敗:', error);
      return Response.json({ 
        error: '建立測驗嘗試記錄失敗：' + error.message 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      attempt_id: attempt.id,
      message: '測驗嘗試記錄建立成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}