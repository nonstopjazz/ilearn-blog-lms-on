import { Suspense } from 'react';
import NotificationsClient from './NotificationsClient';

export default function NotificationsSettingsPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>載入設定中...</p>
          </div>
        </div>
      }
    >
      <NotificationsClient />
    </Suspense>
  );
}