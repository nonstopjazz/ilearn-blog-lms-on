// 統一的 Supabase 服務端客戶端管理
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

/**
 * 獲取 Supabase 客戶端實例（服務端使用）
 * 使用 Service Role Key 以獲得完整權限
 */
export function getSupabaseClient() {
  // 如果已經有實例，直接返回
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // 檢查環境變數
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing environment variables:', {
      url: !!supabaseUrl,
      serviceKey: !!supabaseKey
    });
    return null;
  }

  // 創建並緩存實例
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    return supabaseInstance;
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error);
    return null;
  }
}

/**
 * 清除緩存的實例（主要用於測試）
 */
export function clearSupabaseInstance() {
  supabaseInstance = null;
}

/**
 * 檢查環境變數是否存在
 */
export function checkSupabaseEnv() {
  return {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}