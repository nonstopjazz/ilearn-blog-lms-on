'use client';

import Link from 'next/link';
import { Shield, Home, LogIn } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          存取被拒絕
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          很抱歉，您沒有權限存取此頁面。
          <br />
          此區域僅限管理員使用。
        </p>

        {/* Error Details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">
            <strong>錯誤原因：</strong>需要管理員權限
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/auth"
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            重新登入
          </Link>
          
          <Link
            href="/"
            className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            返回首頁
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            如果您認為這是錯誤，請聯繫系統管理員。
          </p>
        </div>
      </div>
    </div>
  );
}