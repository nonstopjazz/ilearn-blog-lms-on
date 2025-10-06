import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

// 簡化版本：直接使用 anon key 建立客戶端，適用於 Edge Runtime
export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Edge Runtime 不需要 session persistence
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )
}

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