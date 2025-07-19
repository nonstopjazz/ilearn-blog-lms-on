'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { isAdmin, getUserRole, hasPermission, Permission, getRoutePermissionLevel } from '@/lib/security-config';

interface AuthUser extends User {
  user_metadata?: {
    role?: string;
    is_admin?: boolean;
  };
}

interface AuthMiddlewareProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
  fallbackPath?: string;
}

export default function AuthMiddleware({ 
  children, 
  requireAdmin = false, 
  requireAuth = true,
  fallbackPath = '/auth'
}: AuthMiddlewareProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // 獲取當前用戶
        const { data: { user }, error: userError } = await getSupabase().auth.getUser();
        
        if (userError) {
          console.error('認證錯誤:', userError);
          setError('認證失敗');
          if (mounted) {
            setUser(null);
            if (requireAuth) {
              router.push(`${fallbackPath}?redirect=${encodeURIComponent(pathname)}`);
              return;
            }
          }
          return;
        }

        if (!mounted) return;

        // 如果需要認證但沒有用戶
        if (requireAuth && !user) {
          setUser(null);
          router.push(`${fallbackPath}?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        // 如果有用戶，檢查管理員權限
        if (user && requireAdmin) {
          const hasAdminAccess = isAdmin(user);
          
          if (!hasAdminAccess) {
            setError('權限不足：需要管理員權限');
            console.log(`用戶 ${user.email} 嘗試存取管理員區域但權限不足`);
            router.push('/unauthorized');
            return;
          }
          
          console.log(`管理員 ${user.email} 成功存取管理員區域`);
        }

        setUser(user);
      } catch (error) {
        console.error('認證檢查失敗:', error);
        setError('認證系統錯誤');
        if (mounted && requireAuth) {
          router.push(fallbackPath);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // 監聽認證狀態變化
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
      async (event, session) => {
        console.log('認證狀態變化:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          if (requireAuth) {
            router.push(fallbackPath);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          // 重新檢查認證
          checkAuth();
        } else if (event === 'TOKEN_REFRESHED') {
          // Token 更新，重新檢查
          checkAuth();
        }
      }
    );

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [requireAuth, requireAdmin, router, pathname, fallbackPath]);


  // 載入中畫面
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">驗證身份中...</h2>
          <p className="text-gray-600">請稍候，正在檢查您的權限</p>
        </div>
      </div>
    );
  }

  // 錯誤畫面
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">存取被拒絕</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新登入
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 如果不需要認證，或者認證通過，顯示內容
  if (!requireAuth || user) {
    return <>{children}</>;
  }

  // 預設情況下不顯示任何內容
  return null;
}