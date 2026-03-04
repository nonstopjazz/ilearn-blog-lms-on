import { getSupabase } from '@/lib/supabase';

/**
 * 取得當前登入使用者的 access token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await getSupabase().auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * 帶認證的 fetch 包裝器，自動附加 Bearer token
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}
