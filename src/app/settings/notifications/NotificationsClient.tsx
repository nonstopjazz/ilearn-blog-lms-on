'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Clock, Mail, Settings, Save, RotateCcw, CheckCircle, BookOpen, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ReminderSetting {
  id?: number;
  user_id: string;
  course_id: string;
  reminder_type: string;
  is_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  frequency: string;
  preferred_time: string;
}

interface Course {
  id: string;
  title: string;
}

const REMINDER_TYPES = {
  progress: { name: '學習進度提醒', description: '提醒您繼續學習尚未完成的課程' },
  assignment: { name: '作業提醒', description: '提醒您完成新發布的作業' },
  deadline: { name: '截止日期提醒', description: '提醒您即將到期的作業或課程' },
  inactive: { name: '學習中斷提醒', description: '提醒您回到平台繼續學習' }
};

const FREQUENCY_OPTIONS = {
  daily: '每日',
  weekly: '每週',
  biweekly: '雙週'
};

export default function NotificationsClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  const [course, setCourse] = useState<Course | null>(null);
  const [reminders, setReminders] = useState<ReminderSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 載入課程資訊和提醒設定
  useEffect(() => {
    if (user?.id && courseId) {
      loadCourseAndSettings();
    }
  }, [user, courseId]);

  const loadCourseAndSettings = async () => {
    try {
      // 載入課程資訊
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (courseResponse.ok) {
        const courseResult = await courseResponse.json();
        setCourse(courseResult);
      }

      // 載入提醒設定
      const response = await fetch(`/api/learning-reminders?userId=${user?.id}&courseId=${courseId}`);
      const result = await response.json();
      
      if (result.success) {
        setReminders(result.data);
      }
    } catch (error) {
      console.error('載入設定失敗:', error);
      setMessage('載入設定失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const getReminderSetting = (type: string): ReminderSetting => {
    const existing = reminders.find(r => r.reminder_type === type);
    return existing || {
      user_id: user?.id || '',
      course_id: courseId || '',
      reminder_type: type,
      is_enabled: true,
      email_enabled: true,
      push_enabled: false,
      frequency: 'weekly',
      preferred_time: '09:00:00'
    };
  };

  const updateReminderSetting = async (type: string, updates: Partial<ReminderSetting>) => {
    if (!user?.id || !courseId) return;

    setSaving(true);
    try {
      const currentSetting = getReminderSetting(type);
      const updatedSetting = { ...currentSetting, ...updates };

      const response = await fetch('/api/learning-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          courseId: courseId,
          reminderType: type,
          isEnabled: updatedSetting.is_enabled,
          emailEnabled: updatedSetting.email_enabled,
          pushEnabled: updatedSetting.push_enabled,
          frequency: updatedSetting.frequency,
          preferredTime: updatedSetting.preferred_time
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // 重新載入設定
        await loadCourseAndSettings();
        setMessage('設定已成功更新！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('更新失敗：' + (result.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('儲存設定失敗:', error);
      setMessage('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const resetCourseSettings = async () => {
    if (!user?.id || !courseId) return;

    if (confirm('確定要刪除這門課程的所有提醒設定嗎？')) {
      try {
        const response = await fetch(`/api/learning-reminders?userId=${user.id}&courseId=${courseId}`, {
          method: 'DELETE',
        });

        const result = await response.json();
        
        if (result.success) {
          setReminders([]);
          setMessage('課程提醒設定已重置');
        }
      } catch (error) {
        console.error('重置設定失敗:', error);
        setMessage('重置失敗，請稍後再試');
      }
    }
  };

  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">缺少課程 ID</h1>
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            返回上一頁
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">請先登入</h1>
          <a href="/auth" className="text-blue-600 hover:underline">
            前往登入頁面
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>載入設定中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回按鈕 */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回課程
        </button>

        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Settings className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">課程提醒設定</h1>
              {course && (
                <p className="text-lg text-gray-600 mt-1">{course.title}</p>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            為這門課程設定專屬的學習提醒偏好
          </p>
        </div>

        {/* 狀態訊息 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.includes('成功') || message.includes('已更新') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <CheckCircle className="w-5 h-5 mr-2" />
            {message}
          </div>
        )}

        {/* 提醒類型設定 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center mb-4">
              <Bell className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">提醒類型設定</h2>
            </div>
          </div>
          
          <div className="divide-y">
            {Object.entries(REMINDER_TYPES).map(([type, info]) => {
              const setting = getReminderSetting(type);
              
              return (
                <div key={type} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                        {info.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={setting.is_enabled}
                        onChange={(e) => updateReminderSetting(type, { is_enabled: e.target.checked })}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                    </label>
                  </div>

                  {/* 當提醒啟用時顯示詳細設定 */}
                  {setting.is_enabled && (
                    <div className="ml-6 pl-4 border-l-2 border-blue-100 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            提醒頻率
                          </label>
                          <select
                            value={setting.frequency}
                            onChange={(e) => updateReminderSetting(type, { frequency: e.target.value })}
                            disabled={saving}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50"
                          >
                            {Object.entries(FREQUENCY_OPTIONS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            提醒時間
                          </label>
                          <input
                            type="time"
                            value={setting.preferred_time.substring(0, 5)}
                            onChange={(e) => updateReminderSetting(type, { preferred_time: e.target.value + ':00' })}
                            disabled={saving}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={setting.email_enabled}
                            onChange={(e) => updateReminderSetting(type, { email_enabled: e.target.checked })}
                            disabled={saving}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">Email 通知</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={setting.push_enabled}
                            onChange={(e) => updateReminderSetting(type, { push_enabled: e.target.checked })}
                            disabled={saving}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">推播通知</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={resetCourseSettings}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置課程設定
          </button>

          {saving && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              更新中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}