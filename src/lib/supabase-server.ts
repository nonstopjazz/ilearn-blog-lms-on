import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

// 用於讀取資料的簡單客戶端 (categories, tags, posts GET)
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[createSupabaseClient] Missing env vars:', {
      hasUrl: !!url,
      hasKey: !!key,
      url: url ? 'set' : 'MISSING',
      key: key ? 'set' : 'MISSING'
    })
    throw new Error('Missing Supabase environment variables')
  }

  console.log('[createSupabaseClient] Creating client with URL:', url.substring(0, 30) + '...')

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

// 使用 Service Role Key 的管理員客戶端 (POST, PUT, DELETE)
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
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