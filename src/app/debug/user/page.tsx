'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function UserDebugPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        setError(error.message);
      } else {
        setUser(user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
      await supabase.auth.signOut();
      setUser(null);
      alert('已登出！');
      window.location.reload();
    } catch (error) {
      console.error('登出錯誤:', error);
    }
  };

  const clearBrowserData = () => {
    // 清除 localStorage
    localStorage.clear();
    // 清除 sessionStorage
    sessionStorage.clear();
    alert('瀏覽器資料已清除！請重新整理頁面。');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">用戶資訊調試</h1>
            <p className="text-sm text-gray-600 mt-1">檢查目前的登入狀態和用戶資訊</p>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* 登入狀態 */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-lg font-medium text-green-800">已登入</p>
                    <p className="text-sm text-green-600">用戶已通過認證</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  <div>
                    <p className="text-lg font-medium text-red-800">未登入</p>
                    <p className="text-sm text-red-600">沒有有效的認證狀態</p>
                  </div>
                </>
              )}
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-800 font-medium">錯誤</p>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {/* 用戶詳細資訊 */}
            {user && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Info className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-medium text-blue-900">用戶詳細資訊</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700">用戶 ID</label>
                      <p className="mt-1 text-sm text-blue-900 font-mono bg-white p-2 rounded border">
                        {user.id}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Email</label>
                      <p className="mt-1 text-sm text-blue-900 bg-white p-2 rounded border">
                        {user.email}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700">電話</label>
                      <p className="mt-1 text-sm text-blue-900 bg-white p-2 rounded border">
                        {user.phone || '未設定'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Email 驗證狀態</label>
                      <p className="mt-1 text-sm text-blue-900 bg-white p-2 rounded border">
                        {user.email_confirmed_at ? '已驗證' : '未驗證'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700">最後登入</label>
                      <p className="mt-1 text-sm text-blue-900 bg-white p-2 rounded border">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('zh-TW') : '未知'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700">建立時間</label>
                      <p className="mt-1 text-sm text-blue-900 bg-white p-2 rounded border">
                        {new Date(user.created_at).toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Metadata */}
                {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-green-900 mb-3">用戶 Metadata</h3>
                    <pre className="text-sm text-green-800 bg-white p-3 rounded border overflow-auto">
                      {JSON.stringify(user.user_metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* App Metadata */}
                {user.app_metadata && Object.keys(user.app_metadata).length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-purple-900 mb-3">App Metadata (管理員資訊)</h3>
                    <pre className="text-sm text-purple-800 bg-white p-3 rounded border overflow-auto">
                      {JSON.stringify(user.app_metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Raw User Object */}
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="text-lg font-medium text-gray-900 cursor-pointer">
                    完整用戶物件 (點擊展開)
                  </summary>
                  <pre className="text-xs text-gray-700 bg-white p-3 rounded border mt-3 overflow-auto max-h-96">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {user && (
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  登出
                </button>
              )}
              
              <button
                onClick={clearBrowserData}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                清除瀏覽器資料
              </button>
              
              <button
                onClick={loadUserInfo}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                重新載入
              </button>
              
              <a
                href="/auth"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                前往登入頁面
              </a>
            </div>

            {/* 瀏覽器資訊 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">瀏覽器資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-medium text-gray-700">User Agent</label>
                  <p className="mt-1 text-gray-600 break-all">{navigator.userAgent}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">目前 URL</label>
                  <p className="mt-1 text-gray-600 break-all">{window.location.href}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}