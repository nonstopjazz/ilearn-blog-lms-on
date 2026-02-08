'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/security-config';

interface AuthUser extends User {
  user_metadata?: {
    role?: string;
    is_admin?: boolean;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 計算衍生狀態
  const isAuthenticated = !!user;
  const userIsAdmin = user ? isAdmin(user) : false;

  // 刷新認證狀態
  const refreshAuth = async () => {
    try {
      setError(null);

      const { data: { user }, error: userError } = await getSupabase().auth.getUser();

      if (userError) {
        console.error('認證錯誤:', userError);
        setError('認證失敗');
        setUser(null);
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('認證檢查失敗:', error);
      setError('認證系統錯誤');
      setUser(null);
    }
  };

  // 登出
  const signOut = async () => {
    try {
      await getSupabase().auth.signOut();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('登出失敗:', error);
      setError('登出失敗');
    }
  };

  // 初始化和監聽認證狀態變化
  useEffect(() => {
    let mounted = true;

    // 初始檢查
    const initAuth = async () => {
      setLoading(true);
      await refreshAuth();
      if (mounted) {
        setLoading(false);
      }
    };

    // 監聽認證狀態變化
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_OUT':
            setUser(null);
            setError(null);
            break;
          case 'SIGNED_IN':
            if (session?.user) {
              setUser(session.user);
              setError(null);
            }
            break;
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              setUser(session.user);
              setError(null);
            }
            break;
          default:
            // 其他事件，重新檢查狀態
            await refreshAuth();
        }

        setLoading(false);
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin: userIsAdmin,
    signOut,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Loading component
export function AuthLoading() {
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

// Error component
export function AuthError({ error, onRetry }: { error: string; onRetry?: () => void }) {
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
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重試
            </button>
          )}
          <button
            onClick={() => window.location.href = '/auth'}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            重新登入
          </button>
        </div>
      </div>
    </div>
  );
}