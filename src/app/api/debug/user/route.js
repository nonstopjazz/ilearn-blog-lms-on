// src/app/api/debug/user/route.js
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const supabase = createSupabaseAdminClient();, { status: 500 });
    }
    // 從 Authorization header 獲取 token
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ 
        user: null,
        message: '未提供認證 token' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // 驗證 JWT token 並獲取用戶資訊
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('驗證用戶失敗:', error);
      return Response.json({ 
        user: null,
        error: error.message 
      });
    }

    return Response.json({
      user: user,
      message: user ? '用戶驗證成功' : '未找到用戶'
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤',
      message: error.message 
    }, { status: 500 });
  }
}