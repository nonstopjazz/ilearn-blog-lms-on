// src/lib/auth-utils.js
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * 從請求中獲取當前用戶
 * @param {Request} request - HTTP 請求對象
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
export async function getCurrentUser(request) {
  try {
    // 從 Authorization header 獲取 token
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: null }; // 未登入，但不是錯誤
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 獲取 Supabase 客戶端
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { user: null, error: 'Supabase 初始化失敗' };
    }
    
    // 驗證 JWT token 並獲取用戶資訊
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('驗證用戶失敗:', error);
      return { user: null, error: '無效的認證 token' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('獲取用戶資訊失敗:', error);
    return { user: null, error: '認證處理失敗' };
  }
}

/**
 * 從 cookies 中獲取用戶（適用於服務端渲染）
 * @param {Request} request - HTTP 請求對象
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
export async function getCurrentUserFromCookies(request) {
  try {
    // 獲取 cookies
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return { user: null, error: null };
    }

    // 獲取 Supabase 客戶端（注意：這裡使用 anon key）
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { user: null, error: 'Supabase 環境變數缺失' };
    }
    
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 解析 cookies 中的會話
    const cookieStore = parseCookies(cookies);
    const accessToken = cookieStore['sb-access-token'] || cookieStore['supabase-auth-token'];
    
    if (!accessToken) {
      return { user: null, error: null };
    }

    // 使用 access token 獲取用戶
    const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
    
    if (error) {
      console.error('從 cookies 驗證用戶失敗:', error);
      return { user: null, error: null }; // cookie 過期或無效，不報錯
    }

    return { user, error: null };
  } catch (error) {
    console.error('從 cookies 獲取用戶失敗:', error);
    return { user: null, error: null };
  }
}

/**
 * 簡單的 cookie 解析器
 * @param {string} cookieString - cookie 字符串
 * @returns {object} 解析後的 cookie 對象
 */
function parseCookies(cookieString) {
  const cookies = {};
  if (cookieString) {
    cookieString.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  }
  return cookies;
}