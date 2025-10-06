import { createClient } from '@supabase/supabase-js'

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('[createSupabaseAdminClient] Missing env vars:', {
      hasUrl: !!url,
      hasKey: !!key
    })
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}
