'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, AuthLoading, AuthError } from '@/contexts/AuthContext';

interface AuthMiddlewareProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
  fallbackPath?: string;
}

/**
 * 簡化版的 AuthMiddleware - 使用全域認證狀態
 * 主要用於特殊頁面的權限控制，大部分情況下建議直接使用 useAuth Hook
 */
export default function AuthMiddleware({
  children,
  requireAdmin = false,
  requireAuth = true,
  fallbackPath = '/auth'
}: AuthMiddlewareProps) {
  const { user, loading, error, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 檢查權限並處理重導向
  useEffect(() => {
    if (loading) return;

    // 如果需要認證但沒有認證
    if (requireAuth && !isAuthenticated) {
      router.push(`${fallbackPath}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 如果需要管理員權限但沒有權限
    if (requireAdmin && (!isAuthenticated || !isAdmin)) {
      if (!isAuthenticated) {
        router.push(`${fallbackPath}?redirect=${encodeURIComponent(pathname)}`);
      } else {
        router.push('/unauthorized');
      }
      return;
    }
  }, [loading, isAuthenticated, isAdmin, requireAuth, requireAdmin, router, pathname, fallbackPath]);

  // 顯示載入畫面
  if (loading) {
    return <AuthLoading />;
  }

  // 顯示錯誤畫面
  if (error) {
    return <AuthError error={error} />;
  }

  // 如果需要認證但沒有認證
  if (requireAuth && !isAuthenticated) {
    return null; // useEffect 會處理重導向
  }

  // 如果需要管理員權限但沒有權限
  if (requireAdmin && (!isAuthenticated || !isAdmin)) {
    return null; // useEffect 會處理重導向
  }

  // 權限檢查通過，顯示內容
  return <>{children}</>;
}