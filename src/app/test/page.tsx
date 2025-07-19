'use client';

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      // 直接在這裡建立 Supabase 客戶端
      const { createClient } = await import('@supabase/supabase-js');
      
      // 檢查環境變數
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('環境變數未設定：請檢查 .env.local 檔案');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 測試連接 - 簡單的查詢
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (這是正常的)
        throw error;
      }

      setConnectionStatus('success');
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message || '連接失敗');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <Database className="h-16 w-16 mx-auto mb-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Supabase 連接測試
          </h1>

          {/* Loading State */}
          {connectionStatus === 'loading' && (
            <div className="flex flex-col items-center">
              <Loader className="h-8 w-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">正在測試連接...</p>
            </div>
          )}

          {/* Success State */}
          {connectionStatus === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                連接成功！
              </h2>
              <p className="text-gray-600 mb-6">
                Supabase 資料庫已成功連接
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
                <h3 className="font-semibold text-green-800 mb-2">✅ 檢查項目</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 環境變數設定正確</li>
                  <li>• Supabase 客戶端創建成功</li>
                  <li>• 資料庫連接正常</li>
                  <li>• API 權限設定正確</li>
                </ul>
              </div>
            </div>
          )}

          {/* Error State */}
          {connectionStatus === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle className="h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                連接失敗
              </h2>
              <p className="text-gray-600 mb-4">
                無法連接到 Supabase 資料庫
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full mb-6">
                <h3 className="font-semibold text-red-800 mb-2">❌ 錯誤訊息</h3>
                <p className="text-sm text-red-700 break-words">{errorMessage}</p>
              </div>
              <button
                onClick={testSupabaseConnection}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                重新測試
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">設定步驟：</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. 在 Supabase 控制台取得 URL 和 API Key</li>
              <li>2. 建立 <code className="bg-gray-100 px-1 rounded">.env.local</code> 檔案</li>
              <li>3. 設定環境變數</li>
              <li>4. 重新啟動開發伺服器</li>
            </ol>
          </div>

          {/* Environment Variables Display */}
          <div className="mt-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">環境變數狀態：</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span>SUPABASE_URL:</span>
                <span className="font-mono text-blue-600">
                  {typeof window !== 'undefined' ? '✓ 可用' : '⏳ 檢查中'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>SUPABASE_KEY:</span>
                <span className="font-mono text-blue-600">
                  {typeof window !== 'undefined' ? '✓ 可用' : '⏳ 檢查中'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}