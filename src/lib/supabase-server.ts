import { createClient } from '@supabase/supabase-js'

// Simple client for GET requests (categories, tags, posts)
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

// Admin client with Service Role Key for POST/PUT/DELETE
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
