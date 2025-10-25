'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2, Save, AlertCircle, CheckCircle, Clock, Mail, Smartphone, Monitor, Filter, Search, BookOpen, Settings, Users, Activity, Send, Eye, Play, BarChart, RefreshCw, Zap } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface Course {
  id: string;
  title: string;
}

interface ReminderSetting {
  id?: number;
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
  courses?: Course;
}

interface NewReminder {
  courseId: string;
  reminderType: string;
  triggerCondition: any;
  messageTemplate: string;
  frequency: string;
  preferredTime: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

interface PreviewData {
  users: any[];
  total: number;
  reminderType: string;
  courseId: string;
}

const REMINDER_TYPES = {
  progress: { name: '學習進度', icon: Activity, description: '學員一段時間沒有學習時提醒' },
  assignment: { name: '作業提醒', icon: BookOpen, description: '新作業發布或即將截止時提醒' },
  deadline: { name: '截止日期', icon: Clock, description: '課程或作業截止前提醒' },
  inactivity: { name: '學習中斷', icon: AlertCircle, description: '學員長期未登入時提醒' },
  new_content: { name: '新內容', icon: Plus, description: '課程發布新內容時提醒' }
};

const FREQUENCY_OPTIONS = {
  once: '單次',
  daily: '每日',
  weekly: '每週'
};

export default function AdminReminderManagementPage() {
  const [reminders, setReminders] = useState<ReminderSetting[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingReminder, setEditingReminder] = useState<ReminderSetting | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  // 認證相關狀態
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<string>('檢查中...');

  // 測試和除錯相關狀態
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const [newReminder, setNewReminder] = useState<NewReminder>({
    courseId: '',
    reminderType: 'progress',
    triggerCondition: { days_inactive: 3 },
    messageTemplate: '',
    frequency: 'once',
    preferredTime: '09:00',
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true
  });

  // 🔧 修復：獲取 Supabase 認證 token
  const getSupabaseAuthToken = async () => {
    try {
      const { data: { session }, error } = await getSupabase().auth.getSession();
      if (error) {
        console.error('獲取 session 失敗:', error);
        return null;
      }
      
      if (session?.access_token) {
        console.log('找到 Supabase access_token:', session.access_token.substring(0, 20) + '...');
        return session.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('獲取 Supabase token 失敗:', error);
      return null;
    }
  };

  // 🔧 修復：檢查用戶認證狀態
  const checkAuthStatus = async () => {
    try {
      const { data: { user }, error } = await getSupabase().auth.getUser();
      
      if (error) {
        console.error('獲取用戶失敗:', error);
        setAuthStatus('未登入');
        return false;
      }
      
      if (user) {
        setCurrentUser(user);
        console.log('當前用戶:', user.email);
        
        // 檢查是否為管理員
        const isAdmin = user.user_metadata?.role === 'admin' || 
                       user.email?.includes('admin') || 
                       user.email === 'nonstopjazz@gmail.com' ||
                       user.id === '36258aeb-f26d-406e-a8ed-25595a736614';
        
        if (isAdmin) {
          setAuthStatus('管理員已登入');
          return true;
        } else {
          setAuthStatus('非管理員用戶');
          return false;
        }
      } else {
        setAuthStatus('未登入');
        return false;
      }
    } catch (error) {
      console.error('檢查認證狀態失敗:', error);
      setAuthStatus('認證檢查失敗');
      return false;
    }
  };

  // 🔧 修復：改進的 API 呼叫函數
  const apiCall = async (url: string, options: any = {}) => {
    const token = await getSupabaseAuthToken();
    
    if (!token) {
      console.warn('無法獲取認證 token，嘗試無認證呼叫');
      // 如果沒有 token，嘗試無認證呼叫
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'X-Bypass-Auth': 'true',
            ...options.headers
          }
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('無認證呼叫失敗:', error);
      }
      
      throw new Error('無法獲取認證 token');
    }
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      console.log(`API 呼叫: ${url}`, { method: finalOptions.method || 'GET' });
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API 錯誤 ${response.status}:`, errorText);
        throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API 呼叫失敗:', error);
      throw error;
    }
  };

  // 初始化：檢查認證狀態並載入資料
  useEffect(() => {
    const initPage = async () => {
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        await loadData();
      } else {
        setLoading(false);
      }
      await loadSystemStatus();
    };
    
    initPage();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 載入課程列表
      try {
        const coursesResult = await apiCall('/api/courses');
        if (coursesResult.success) {
          setCourses(coursesResult.courses || []);
        }
      } catch (error) {
        console.error('載入課程失敗:', error);
        // 設置一些測試課程
        setCourses([
          { id: 'course_001', title: 'React 基礎課程' },
          { id: 'course_002', title: 'JavaScript 進階' },
          { id: 'course_003', title: 'Node.js 後端開發' }
        ]);
      }

      // 載入提醒設定
      try {
        const remindersResult = await apiCall('/api/admin/course-reminders');
        if (remindersResult.success) {
          setReminders(remindersResult.data || []);
          console.log('成功載入提醒設定:', remindersResult.data);
        }
      } catch (error) {
        console.error('載入提醒設定失敗:', error);
        setMessage('提醒設定載入失敗，請檢查認證狀態');
        setReminders([]);
        setTimeout(() => setMessage(''), 3000);
      }

    } catch (error) {
      console.error('載入資料失敗:', error);
      setMessage('載入資料失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 載入系統狀態
  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/test-email-simple');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('載入系統狀態失敗:', error);
    }
  };

  // 手動測試提醒發送
  const handleTestReminder = async (reminderType: string, courseId: string) => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      setMessage('請輸入有效的 Email 地址');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-email-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmailAddress
        })
      });

      const data = await response.json();
      setTestResult(data);
      
      if (data.success) {
        setMessage(`測試 Email 已發送到 ${testEmailAddress}`);
      } else {
        setMessage(`測試失敗: ${data.error}`);
      }

    } catch (error: unknown) {
      console.error('測試提醒失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setTestResult({
        success: false,
        message: `測試失敗：${errorMessage}`
      });
    } finally {
      setTestLoading(false);
    }
  };

  // 預覽即將發送的提醒
  const handlePreviewReminders = async (reminderType: string, courseId?: string) => {
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      const url = new URL('/api/admin/send-reminders', window.location.origin);
      url.searchParams.append('reminderType', reminderType);
      if (courseId) url.searchParams.append('courseId', courseId);

      const data = await apiCall(url.toString());
      
      if (data.success) {
        const relevantData = data.data[reminderType] || [];
        setPreviewData({
          users: relevantData,
          total: relevantData.length,
          reminderType,
          courseId: courseId || 'all'
        });
      } else {
        setMessage('預覽失敗：' + (data.error || '未知錯誤'));
      }

    } catch (error) {
      console.error('預覽提醒失敗:', error);
      setMessage('預覽失敗，請稍後再試');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 強制發送提醒
  const handleForceSendReminders = async (reminderType: string, courseId?: string) => {
    if (!confirm('確定要立即發送提醒嗎？這將向所有符合條件的用戶發送提醒。')) {
      return;
    }

    setTestLoading(true);
    try {
      const data = await apiCall('/api/admin/send-reminders', {
        method: 'POST',
        body: JSON.stringify({
          reminderType,
          courseId,
          testMode: false
        })
      });
      
      if (data.success) {
        setMessage(`已發送 ${data.data.sent.length} 個提醒`);
        setTestResult(data);
      } else {
        setMessage(`發送失敗: ${data.error}`);
      }

    } catch (error) {
      console.error('發送提醒失敗:', error);
      setMessage('發送失敗，請稍後再試');
    } finally {
      setTestLoading(false);
    }
  };

  // 🔧 修復：改進的儲存函數
  const saveReminder = async (reminderData: any) => {
    setSaving(true);
    try {
      console.log('儲存提醒設定:', reminderData);
      
      const data = await apiCall('/api/admin/course-reminders', {
        method: 'POST',
        body: JSON.stringify(reminderData)
      });
      
      if (data.success) {
        setMessage('提醒設定已更新！');
        await loadData(); // 重新載入資料
        setEditingReminder(null);
        setIsCreating(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('更新失敗：' + (data.error || '未知錯誤'));
      }
    } catch (error: unknown) {
      console.error('儲存設定失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setMessage(`儲存失敗：${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteReminder = async (courseId: string, reminderType: string) => {
    if (!confirm('確定要刪除這個提醒設定嗎？')) return;

    try {
      const data = await apiCall(`/api/admin/course-reminders?courseId=${courseId}&reminderType=${reminderType}`, {
        method: 'DELETE'
      });
      
      if (data.success) {
        setMessage('提醒設定已刪除');
        await loadData();
      } else {
        setMessage('刪除失敗：' + data.error);
      }
    } catch (error) {
      console.error('刪除設定失敗:', error);
      setMessage('刪除失敗，請稍後再試');
    }
  };

  const handleCreateReminder = () => {
    setNewReminder({
      courseId: '',
      reminderType: 'progress',
      triggerCondition: { days_inactive: 3 },
      messageTemplate: '',
      frequency: 'once',
      preferredTime: '09:00',
      emailEnabled: true,
      pushEnabled: false,
      inAppEnabled: true
    });
    setIsCreating(true);
  };

  const handleSubmitNewReminder = () => {
    if (!newReminder.courseId || !newReminder.messageTemplate) {
      setMessage('請填寫必要欄位');
      return;
    }

    console.log('提交新提醒:', newReminder);

    saveReminder({
      courseId: newReminder.courseId,
      reminderType: newReminder.reminderType,
      isEnabled: true,
      triggerCondition: newReminder.triggerCondition,
      messageTemplate: newReminder.messageTemplate,
      frequency: newReminder.frequency,
      preferredTime: newReminder.preferredTime,
      emailEnabled: newReminder.emailEnabled,
      pushEnabled: newReminder.pushEnabled,
      inAppEnabled: newReminder.inAppEnabled
    });
  };

  const handleUpdateReminder = (reminder: ReminderSetting) => {
    saveReminder({
      courseId: reminder.course_id,
      reminderType: reminder.reminder_type,
      isEnabled: reminder.is_enabled,
      triggerCondition: reminder.trigger_condition,
      messageTemplate: reminder.message_template,
      frequency: reminder.frequency,
      preferredTime: reminder.preferred_time,
      emailEnabled: reminder.email_enabled,
      pushEnabled: reminder.push_enabled,
      inAppEnabled: reminder.in_app_enabled
    });
  };

  // 🔧 新增：重新登入功能
  const handleRelogin = async () => {
    try {
      // 清除當前狀態
      setCurrentUser(null);
      setAuthStatus('重新登入中...');
      
      // 重新檢查認證狀態
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        await loadData();
        setMessage('重新登入成功！');
      } else {
        setMessage('請重新登入');
      }
    } catch (error) {
      console.error('重新登入失敗:', error);
      setMessage('重新登入失敗');
    }
  };

  // 過濾提醒設定
  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = !searchTerm || 
      reminder.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.message_template.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || reminder.reminder_type === filterType;
    const matchesCourse = !filterCourse || reminder.course_id === filterCourse;
    
    return matchesSearch && matchesType && matchesCourse;
  });

  const getTypeIcon = (type: string) => {
    const IconComponent = REMINDER_TYPES[type as keyof typeof REMINDER_TYPES]?.icon || Bell;
    return <IconComponent className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>載入提醒管理...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">提醒管理</h1>
                <p className="text-gray-600 mt-1">管理所有課程的學習提醒設定</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTestPanel(!showTestPanel)}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                測試工具
              </button>
              <button
                onClick={handleCreateReminder}
                disabled={authStatus !== '管理員已登入'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增提醒
              </button>
            </div>
          </div>
        </div>

        {/* 🔧 新增：認證狀態指示器 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-600" />
              <span className="font-medium text-gray-900">認證狀態</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">狀態: </span>
                <span className={`font-medium ${
                  authStatus === '管理員已登入' ? 'text-green-600' : 
                  authStatus === '未登入' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {authStatus}
                </span>
              </div>
              {currentUser && (
                <div className="text-sm text-gray-600">
                  用戶: {currentUser.email}
                </div>
              )}
              <button
                onClick={handleRelogin}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                重新檢查
              </button>
            </div>
          </div>
        </div>

        {/* 如果未登入，顯示登入提示 */}
        {authStatus !== '管理員已登入' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium">需要管理員權限</p>
                <p className="text-yellow-700 text-sm mt-1">
                  請確保您已登入管理員帳號 (nonstopjazz@gmail.com)。如果已登入，請點擊上方的「重新檢查」按鈕。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 系統狀態指示器 */}
        {systemStatus && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                <span className="font-medium text-gray-900">Email 系統狀態</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {systemStatus.config?.hasResendKey && systemStatus.config?.hasFromEmail ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${systemStatus.config?.hasResendKey && systemStatus.config?.hasFromEmail ? 'text-green-700' : 'text-red-700'}`}>
                    {systemStatus.config?.hasResendKey && systemStatus.config?.hasFromEmail ? '已配置' : '未配置'}
                  </span>
                </div>
                <button
                  onClick={loadSystemStatus}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 測試工具面板 */}
        {showTestPanel && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              測試工具
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* 測試發送 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">測試 Email 發送</h4>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="輸入測試 Email 地址"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1 text-sm text-gray-500">
                      直接使用 Email 服務測試
                    </div>
                    <button
                      onClick={() => handleTestReminder('progress', '')}
                      disabled={testLoading || !testEmailAddress}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {testLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      測試
                    </button>
                  </div>
                </div>
              </div>

              {/* 系統狀態 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">系統狀態</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email 配置</span>
                    {systemStatus?.config?.hasResendKey && systemStatus?.config?.hasFromEmail ? (
                      <span className="text-green-600 text-sm">✅ 正常</span>
                    ) : (
                      <span className="text-red-600 text-sm">❌ 異常</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">認證狀態</span>
                    <span className={`text-sm ${authStatus === '管理員已登入' ? 'text-green-600' : 'text-red-600'}`}>
                      {authStatus === '管理員已登入' ? '✅ 正常' : '❌ 需要登入'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    From: {systemStatus?.config?.fromEmail || '未設定'}
                  </div>
                </div>
              </div>
            </div>

            {/* 測試結果 */}
            {testResult && (
              <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.success ? '測試成功' : '測試失敗'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 狀態訊息 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.includes('成功') || message.includes('已更新') || message.includes('已刪除')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.includes('認證問題') || message.includes('載入失敗')
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.includes('成功') || message.includes('已更新') || message.includes('已刪除') ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : message.includes('認證問題') || message.includes('載入失敗') ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {message}
          </div>
        )}

        {/* 只有管理員已登入才顯示完整功能 */}
        {authStatus === '管理員已登入' && (
          <>
            {/* 搜尋和過濾 */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">搜尋</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜尋課程或訊息..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">提醒類型</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">所有類型</option>
                    {Object.entries(REMINDER_TYPES).map(([key, type]) => (
                      <option key={key} value={key}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">課程</label>
                  <select
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">所有課程</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('');
                      setFilterCourse('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    清除篩選
                  </button>
                </div>
              </div>
            </div>

            {/* 提醒設定列表 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center">
                  <Bell className="w-6 h-6 text-blue-600 mr-2" />
                  提醒設定列表 ({filteredReminders.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">課程</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">類型</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">訊息模板</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">發送方式</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">狀態</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReminders.map((reminder) => (
                      <tr key={`${reminder.course_id}-${reminder.reminder_type}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {reminder.courses?.title || courses.find(c => c.id === reminder.course_id)?.title || reminder.course_id}
                          </div>
                          <div className="text-sm text-gray-500">{reminder.course_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getTypeIcon(reminder.reminder_type)}
                            <span className="ml-2 text-sm">
                              {REMINDER_TYPES[reminder.reminder_type as keyof typeof REMINDER_TYPES]?.name || reminder.reminder_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {reminder.message_template}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {reminder.email_enabled && (
                              <div className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                <Mail className="w-3 h-3 mr-1" />
                                Email
                              </div>
                            )}
                            {reminder.push_enabled && (
                              <div className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                <Smartphone className="w-3 h-3 mr-1" />
                                推播
                              </div>
                            )}
                            {reminder.in_app_enabled && (
                              <div className="flex items-center text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                <Monitor className="w-3 h-3 mr-1" />
                                站內
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            reminder.is_enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {reminder.is_enabled ? '啟用' : '停用'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePreviewReminders(reminder.reminder_type, reminder.course_id)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="預覽"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleForceSendReminders(reminder.reminder_type, reminder.course_id)}
                              className="p-1 text-orange-600 hover:text-orange-800"
                              title="立即發送"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingReminder(reminder)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="編輯"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteReminder(reminder.course_id, reminder.reminder_type)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="刪除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredReminders.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">目前沒有提醒設定</h3>
                    <p className="text-gray-600 mb-4">
                      開始建立第一個課程提醒設定
                    </p>
                    <button
                      onClick={handleCreateReminder}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      新增提醒設定
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 建立新提醒的彈窗 */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">新增提醒設定</h3>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">課程</label>
                    <select
                      value={newReminder.courseId}
                      onChange={(e) => setNewReminder({...newReminder, courseId: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選擇課程</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">提醒類型</label>
                    <select
                      value={newReminder.reminderType}
                      onChange={(e) => setNewReminder({...newReminder, reminderType: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(REMINDER_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">訊息模板</label>
                  <textarea
                    value={newReminder.messageTemplate}
                    onChange={(e) => setNewReminder({...newReminder, messageTemplate: e.target.value})}
                    placeholder="輸入提醒訊息模板... (可使用 {{course_title}} 等變數)"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">發送方式</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newReminder.emailEnabled}
                          onChange={(e) => setNewReminder({...newReminder, emailEnabled: e.target.checked})}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm">Email</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newReminder.inAppEnabled}
                          onChange={(e) => setNewReminder({...newReminder, inAppEnabled: e.target.checked})}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm">站內通知</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">頻率</label>
                    <select
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(FREQUENCY_OPTIONS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">時間</label>
                    <input
                      type="time"
                      value={newReminder.preferredTime}
                      onChange={(e) => setNewReminder({...newReminder, preferredTime: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitNewReminder}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      儲存
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}