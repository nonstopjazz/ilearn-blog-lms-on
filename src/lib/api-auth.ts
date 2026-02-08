// src/lib/api-auth.ts
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAdmin as checkIsAdmin, hasPermission, Permission } from '@/lib/security-config';

// 定義 API context 型別
interface ApiContext {
  params?: Record<string, string | string[]>;
  [key: string]: unknown;
}

// 延遲初始化 Supabase 客戶端
function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * 從 cookie 中獲取當前登入的用戶（支援前端 fetch 自動傳送的 cookie）
 */
export async function getAuthUserFromCookies() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * 從請求中獲取並驗證用戶（優先 Bearer token，fallback cookie）
 */
export async function authenticateRequest(request: Request) {
  try {
    // 嘗試從 Authorization header 獲取 token
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback: 嘗試從 cookie 獲取用戶
      const cookieUser = await getAuthUserFromCookies();
      return { user: cookieUser, error: null };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 獲取 Supabase 客戶端
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('API 認證失敗: Supabase client not available');
      return { user: null, error: 'Authentication service unavailable' };
    }
    
    // 驗證 token 並獲取用戶
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('API 認證失敗:', error);
      return { user: null, error: 'Invalid authentication token' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('API 認證處理失敗:', error);
    return { user: null, error: 'Authentication processing failed' };
  }
}

/**
 * 檢查 API 請求的管理員權限
 */
export async function requireAdmin(request: Request) {
  const { user, error } = await authenticateRequest(request);
  
  if (error) {
    return {
      success: false,
      error,
      status: 401,
      response: Response.json({ error }, { status: 401 })
    };
  }
  
  if (!user) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401,
      response: Response.json({ error: 'Authentication required' }, { status: 401 })
    };
  }
  
  if (!checkIsAdmin(user)) {
    return {
      success: false,
      error: 'Admin access required',
      status: 403,
      response: Response.json({ error: 'Admin access required' }, { status: 403 })
    };
  }
  
  return {
    success: true,
    user,
    error: null
  };
}

/**
 * 檢查 API 請求的認證（不需要特殊權限）
 */
export async function requireAuth(request: Request) {
  const { user, error } = await authenticateRequest(request);
  
  if (error) {
    return {
      success: false,
      error,
      status: 401,
      response: Response.json({ error }, { status: 401 })
    };
  }
  
  if (!user) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401,
      response: Response.json({ error: 'Authentication required' }, { status: 401 })
    };
  }
  
  return {
    success: true,
    user,
    error: null
  };
}

/**
 * 檢查特定權限
 */
export async function requirePermission(request: Request, permission: Permission) {
  const { user, error } = await authenticateRequest(request);
  
  if (error) {
    return {
      success: false,
      error,
      status: 401,
      response: Response.json({ error }, { status: 401 })
    };
  }
  
  if (!user) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401,
      response: Response.json({ error: 'Authentication required' }, { status: 401 })
    };
  }
  
  if (!hasPermission(user, permission)) {
    return {
      success: false,
      error: `Permission ${permission} required`,
      status: 403,
      response: Response.json({ error: `Insufficient permissions` }, { status: 403 })
    };
  }
  
  return {
    success: true,
    user,
    error: null
  };
}

/**
 * API 路由包裝器，自動處理認證和權限檢查
 */
export function withAuth(handler: (request: Request, context: ApiContext) => Promise<Response>) {
  return async (request: Request, context: ApiContext) => {
    const auth = await requireAuth(request);
    if (!auth.success) {
      return auth.response!;
    }
    
    // 將用戶信息添加到 context
    const enhancedContext = {
      ...context,
      user: auth.user
    };
    
    return handler(request, enhancedContext);
  };
}

/**
 * 管理員 API 路由包裝器
 */
export function withAdminAuth(handler: (request: Request, context: ApiContext) => Promise<Response>) {
  return async (request: Request, context: ApiContext) => {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return auth.response!;
    }
    
    // 將用戶信息添加到 context
    const enhancedContext = {
      ...context,
      user: auth.user,
      isAdmin: true
    };
    
    return handler(request, enhancedContext);
  };
}

/**
 * 權限檢查 API 路由包裝器
 */
export function withPermission(permission: Permission) {
  return function(handler: (request: Request, context: ApiContext) => Promise<Response>) {
    return async (request: Request, context: ApiContext) => {
      const auth = await requirePermission(request, permission);
      if (!auth.success) {
        return auth.response!;
      }

      // 將用戶信息添加到 context
      const enhancedContext = {
        ...context,
        user: auth.user,
        permissions: [permission]
      };

      return handler(request, enhancedContext);
    };
  };
}

/**
 * 簡單的 API Key 驗證（用於內部 API 調用）
 * 安全增強：移除開發環境自動繞過，強制驗證 API Key
 */
export async function verifyApiKey(request: Request) {
  // 檢查 API_KEY 是否已設定
  if (!process.env.API_KEY) {
    console.error('[Security] API_KEY environment variable is not configured');
    return { valid: false, error: 'API authentication is not configured' };
  }

  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return { valid: false, error: 'API key required' };
  }

  if (apiKey !== process.env.API_KEY) {
    console.warn('[Security] Invalid API key attempt from:', request.headers.get('x-forwarded-for') || 'unknown');
    return { valid: false, error: 'Invalid API key' };
  }

  return { valid: true };
}