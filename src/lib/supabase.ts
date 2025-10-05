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

// 為了向後兼容，提供 getter 函數
// 強烈建議直接使用 getSupabase() 函數
// 使用 getter 避免在模組載入時就建立實例
let _legacySupabaseInstance: SupabaseClient | null = null
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!_legacySupabaseInstance) {
      _legacySupabaseInstance = getSupabase()
    }
    return (_legacySupabaseInstance as any)[prop]
  }
})