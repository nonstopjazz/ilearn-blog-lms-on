// src/app/api/debug/quiz-attempts/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // 檢查 quiz_attempts 表結構
    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .limit(5);

    if (error) {
      console.error('查詢 quiz_attempts 表失敗:', error);
      return Response.json({ 
        error: '查詢失敗',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    // 也檢查表結構
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'quiz_attempts');

    return Response.json({
      success: true,
      attempts: attempts || [],
      tableStructure: tableInfo || [],
      message: `找到 ${attempts?.length || 0} 筆嘗試記錄`
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤',
      message: error.message 
    }, { status: 500 });
  }
}