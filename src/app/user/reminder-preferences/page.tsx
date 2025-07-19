'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, Mail, Settings, Save, CheckCircle, BookOpen, User, Activity, AlertCircle, Monitor, Smartphone } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface ReminderSetting {
  id: number;
  course_id: string;
  reminder_type: string;
  is_enabled: boolean;
  trigger_condition: any;
  message_template: string;
  frequency: string;
  preferred_time: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  courses: {
    id: string;
    title: string;
  };
  user_enabled: boolean;
  user_preference_id: number | null;
}

const REMINDER_TYPES = {
  progress: { name: '學習進度', icon: Activity, description: '學習進度提醒' },
  assignment: { name: '作業提醒', icon: BookOpen, description: '作業相關提醒' },
  deadline: { name: '截止日期', icon: Clock, description: '截止日期提醒' },
  inactive: { name: '學習中斷', icon: AlertCircle, description: '學習中斷提醒' },
  new_content: { name: '新內容', icon: Bell, description: '新內容發布提醒' }
};

export default function UserReminderPreferencesPage() {
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [reminders, setReminders] = useState<ReminderSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // 檢查認證狀態
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setUserLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登出處理
  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 載入用戶的提醒偏好設定
  useEffect(() => {
    if (user?.id) {
      loadReminderPreferences();
    }
  }, [user]);

  const loadReminderPreferences = async () => {
    try {
      setLoading(true);
      
      // 獲取 Supabase session token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/user/reminder-preferences?userId=${user?.id}`, {
        headers
      });
      
      const result = await response.json();
      
      if (result.success) {
        setReminders(result.data || []);
      } else {
        setMessage('載入設定失敗：' + result.error);
      }
    } catch (error) {
      console.error('載入提醒偏好失敗:', error);
      setMessage('載入設定失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const updateReminderPreference = async (courseId: string, reminderType: string, isEnabled: boolean) => {
    setSaving(true);
    try {
      // 獲取 Supabase session token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/user/reminder-preferences', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user?.id,
          courseId: courseId,
          reminderType: reminderType,
          isEnabled: isEnabled
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // 更新本地狀態
        setReminders(prev => prev.map(reminder => 
          reminder.course_id === courseId && reminder.reminder_type === reminderType
            ? { ...reminder, user_enabled: isEnabled }
            : reminder
        ));
        
        setMessage(`已${isEnabled ? '開啟' : '關閉'}提醒`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('更新失敗：' + (result.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('更新提醒偏好失敗:', error);
      setMessage('更新失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const batchUpdatePreferences = async (enabled: boolean) => {
    if (!confirm(`確定要${enabled ? '開啟' : '關閉'}所有提醒嗎？`)) return;

    setSaving(true);
    try {
      const preferences = filteredReminders.map(reminder => ({
        courseId: reminder.course_id,
        reminderType: reminder.reminder_type,
        isEnabled: enabled
      }));

      // 獲取 Supabase session token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/user/reminder-preferences', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: user?.id,
          preferences: preferences
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await loadReminderPreferences(); // 重新載入
        setMessage(`已${enabled ? '開啟' : '關閉'}所有提醒`);
      } else {
        setMessage('批量更新失敗：' + result.error);
      }
    } catch (error) {
      console.error('批量更新失敗:', error);
      setMessage('批量更新失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  // 過濾提醒設定
  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = !searchTerm || 
      reminder.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.message_template.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || reminder.reminder_type === filterType;
    
    return matchesSearch && matchesType;
  });

  // 按課程分組
  const groupedReminders = filteredReminders.reduce((groups, reminder) => {
    const courseId = reminder.course_id;
    if (!groups[courseId]) {
      groups[courseId] = {
        course: reminder.courses,
        reminders: []
      };
    }
    groups[courseId].reminders.push(reminder);
    return groups;
  }, {} as Record<string, { course: any; reminders: ReminderSetting[] }>);

  const getTypeIcon = (type: string) => {
    const IconComponent = REMINDER_TYPES[type]?.icon || Bell;
    return React.createElement(IconComponent, { className: "w-4 h-4" });
  };

  // 處理模板變數替換
  const processMessageTemplate = (template: string, courseTitle: string) => {
    return template
      .replace(/\{\{course_title\}\}/g, courseTitle)
      .replace(/\{\{course_name\}\}/g, courseTitle)
      .replace(/\{\{user_name\}\}/g, user?.user_metadata?.full_name || user?.email || '您');
  };

  // 檢查載入狀態
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>檢查登入狀態...</p>
        </div>
      </div>
    );
  }

  // 未登入時重導向
  if (!user) {
    // 使用當前完整路徑作為 redirect 參數
    const currentPath = '/user/reminder-preferences';
    window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">請先登入</h1>
          <p className="text-gray-600 mb-4">正在重導向到登入頁面...</p>
          <a href="/auth" className="text-blue-600 hover:underline">
            如果沒有自動跳轉，請點擊這裡
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>載入提醒設定...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onSignOut={handleSignOut} />
      
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* 頁面標題 */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <User className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">我的提醒設定</h1>
                <p className="text-gray-600 mt-1">
                  管理您的課程學習提醒偏好
                </p>
              </div>
            </div>
          </div>

          {/* 狀態訊息 */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.includes('成功') || message.includes('已開啟') || message.includes('已關閉')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <CheckCircle className="w-5 h-5 mr-2" />
              {message}
            </div>
          )}

          {/* 搜尋和批量操作 */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜尋課程..."
                    className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full md:w-48 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">所有提醒類型</option>
                  {Object.entries(REMINDER_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => batchUpdatePreferences(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  全部開啟
                </button>
                <button
                  onClick={() => batchUpdatePreferences(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  全部關閉
                </button>
              </div>
            </div>
          </div>

          {/* 提醒設定列表 - 按課程分組 */}
          <div className="space-y-6">
            {Object.entries(groupedReminders).map(([courseId, group]) => (
              <div key={courseId} className="bg-white rounded-lg shadow-sm border">
                {/* 課程標題 */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {group.course?.title || courseId}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {group.reminders.length} 個提醒設定
                      </p>
                    </div>
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                {/* 提醒設定 */}
                <div className="divide-y divide-gray-200">
                  {group.reminders.map((reminder) => (
                    <div key={`${reminder.course_id}-${reminder.reminder_type}`} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {getTypeIcon(reminder.reminder_type)}
                            <h4 className="ml-2 font-medium text-gray-900">
                              {REMINDER_TYPES[reminder.reminder_type]?.name || reminder.reminder_type}
                            </h4>
                          </div>
                          
                          <p className="text-gray-600 mb-3 text-sm">
                            {processMessageTemplate(reminder.message_template, reminder.courses?.title || '')}
                          </p>

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {reminder.preferred_time} ({reminder.frequency})
                            </div>
                            
                            <div className="flex space-x-2">
                              {reminder.email_enabled && (
                                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email
                                </div>
                              )}
                              {reminder.push_enabled && (
                                <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded">
                                  <Smartphone className="w-3 h-3 mr-1" />
                                  推播
                                </div>
                              )}
                              {reminder.in_app_enabled && (
                                <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  <Monitor className="w-3 h-3 mr-1" />
                                  站內
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-6">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={reminder.user_enabled}
                              onChange={(e) => updateReminderPreference(
                                reminder.course_id, 
                                reminder.reminder_type, 
                                e.target.checked
                              )}
                              disabled={saving}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 空狀態 */}
          {filteredReminders.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到提醒設定</h3>
              <p className="text-gray-600 mb-6">
                {reminders.length === 0 
                  ? '管理員尚未為您的課程設定任何提醒' 
                  : '嘗試調整搜尋條件或篩選器'
                }
              </p>
              {searchTerm || filterType ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  清除篩選
                </button>
              ) : null}
            </div>
          )}

          {/* 說明區塊 */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">關於提醒設定</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 這些提醒是由管理員為您的課程設定的</li>
              <li>• 您可以選擇開啟或關閉個別提醒</li>
              <li>• 提醒會根據您的學習進度自動發送</li>
              <li>• 您可以隨時修改這些設定</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}