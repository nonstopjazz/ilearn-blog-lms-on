// src/lib/api-auth.ts
import { createClient } from '@supabase/supabase-js';
import { isAdmin, getUserRole, hasPermission, Permission } from '@/lib/security-config';

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
 * 從請求中獲取並驗證用戶
 */
export async function authenticateRequest(request: Request) {
  try {
    // 嘗試從 Authorization header 獲取 token
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: null }; // 未認證，但不一定是錯誤
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
  
  if (!isAdmin(user)) {
    console.log(`用戶 ${user.email} 嘗試存取管理員 API 但權限不足`);
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
    console.log(`用戶 ${user.email} 嘗試執行需要 ${permission} 權限的操作`);
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
export function withAuth(handler: (request: Request, context: any) => Promise<Response>) {
  return async (request: Request, context: any) => {
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
export function withAdminAuth(handler: (request: Request, context: any) => Promise<Response>) {
  return async (request: Request, context: any) => {
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
  return function(handler: (request: Request, context: any) => Promise<Response>) {
    return async (request: Request, context: any) => {
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