import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

// 檢查環境變數是否存在
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 建立單例模式的 Supabase 客戶端
export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Client] Missing environment variables:', {
      url: !!supabaseUrl,
      anonKey: !!supabaseAnonKey
    })
    throw new Error('Supabase environment variables are not configured')
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseInstance
}

// 為了向後兼容，導出 supabase 實例
// 但建議使用 getSupabase() 函數
export const supabase = typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any