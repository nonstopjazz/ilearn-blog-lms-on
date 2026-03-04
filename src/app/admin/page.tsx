'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import { 
  BookOpen, 
  Users, 
  Brain, 
  BarChart3, 
  Bell, 
  FileText, 
  Plus, 
  Settings, 
  Upload, 
  ClipboardList,
  TrendingUp,
  UserCheck,
  Calendar,
  Activity,
  ChevronRight,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Tag,
  Hash
} from 'lucide-react';

interface DashboardStats {
  totalCourses: number;
  totalUsers: number;
  totalQuizzes: number;
  pendingRequests: number;
  recentActivity: any[];
}

interface AdminFunction {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  category: string;
}

interface EmailSystemStatus {
  isConfigured: boolean;
  configStatus: Record<string, string>;
  missingVars: string[];
  emailStats: {
    total: number;
    sent: number;
    failed: number;
    recentLogs: any[];
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalUsers: 0,
    totalQuizzes: 0,
    pendingRequests: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [emailSystemStatus, setEmailSystemStatus] = useState<EmailSystemStatus | null>(null);

  // 載入統計資料
  useEffect(() => {
    const loadStats = async () => {
      try {
        // 調用真實的統計 API
        const response = await authFetch('/api/admin/stats');
        const result = await response.json();

        if (result.success && result.data) {
          setStats(result.data);
        } else {
          console.error('載入統計資料失敗:', result.error);
          // 使用預設值
          setStats({
            totalCourses: 0,
            totalUsers: 0,
            totalQuizzes: 0,
            pendingRequests: 0,
            recentActivity: []
          });
        }
      } catch (error) {
        console.error('載入統計資料失敗:', error);
        // 使用預設值
        setStats({
          totalCourses: 0,
          totalUsers: 0,
          totalQuizzes: 0,
          pendingRequests: 0,
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    loadEmailSystemStatus();
  }, []);

  // 載入 Email 系統狀態
  const loadEmailSystemStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, using test API');
        const response = await authFetch('/api/test-email-simple', {
          method: 'GET'
        });
        
        if (response.ok) {
          const data = await response.json();
          setEmailSystemStatus({
            isConfigured: data.config.hasResendKey && data.config.hasFromEmail,
            configStatus: data.config,
            missingVars: [],
            emailStats: {
              total: 0,
              sent: 0,
              failed: 0,
              recentLogs: []
            }
          });
        }
        return;
      }

      const response = await authFetch('/api/admin/test-email', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmailSystemStatus(data.data);
      } else if (response.status === 401) {
        console.log('Token invalid, using test API');
        const testResponse = await authFetch('/api/test-email-simple', {
          method: 'GET'
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          setEmailSystemStatus({
            isConfigured: testData.config.hasResendKey && testData.config.hasFromEmail,
            configStatus: testData.config,
            missingVars: [],
            emailStats: {
              total: 0,
              sent: 0,
              failed: 0,
              recentLogs: []
            }
          });
        }
      }
    } catch (error) {
      console.error('載入 Email 系統狀態失敗:', error);
    }
  };

  const adminFunctions: AdminFunction[] = [
    // 課程管理
    {
      title: '課程管理',
      description: '查看和管理所有課程',
      href: '/admin/courses',
      icon: BookOpen,
      color: 'bg-blue-500',
      category: '課程管理'
    },
    {
      title: '建立課程',
      description: '建立新的課程內容',
      href: '/admin/course-create',
      icon: Plus,
      color: 'bg-green-500',
      category: '課程管理'
    },
    {
      title: '課程設定',
      description: '編輯課程詳細設定',
      href: '/admin/course-settings',
      icon: Settings,
      color: 'bg-indigo-500',
      category: '課程管理'
    },

    // 測驗系統
    {
      title: '測驗管理',
      description: '管理所有測驗內容',
      href: '/admin/quiz-settings',
      icon: Brain,
      color: 'bg-purple-500',
      category: '測驗系統'
    },
    {
      title: '建立測驗',
      description: '手動建立新測驗',
      href: '/admin/quiz-create',
      icon: Plus,
      color: 'bg-violet-500',
      category: '測驗系統'
    },
    {
      title: '批量上傳',
      description: '批量上傳測驗題目',
      href: '/admin/quiz-upload',
      icon: Upload,
      color: 'bg-pink-500',
      category: '測驗系統'
    },
    {
      title: '測驗結果',
      description: '查看測驗成績管理',
      href: '/admin/quiz-results',
      icon: ClipboardList,
      color: 'bg-rose-500',
      category: '測驗系統'
    },
    {
      title: '測驗分析',
      description: '測驗數據統計分析',
      href: '/admin/quiz-analytics',
      icon: BarChart3,
      color: 'bg-orange-500',
      category: '測驗系統'
    },

    // 用戶管理
    {
      title: '申請管理',
      description: '處理課程申請請求',
      href: '/admin/requests',
      icon: UserCheck,
      color: 'bg-cyan-500',
      category: '用戶管理'
    },

    // 學習管理
    {
      title: '學習管理',
      description: '管理學生學習記錄與進度',
      href: '/admin/learning-management',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      category: '學習管理'
    },

    // 內容管理
    {
      title: 'Blog 管理',
      description: '管理部落格文章內容',
      href: '/admin/blog',
      icon: FileText,
      color: 'bg-teal-500',
      category: '內容管理'
    },
    {
      title: '分類管理',
      description: '管理 Blog 文章分類',
      href: '/admin/blog/categories',
      icon: Tag,
      color: 'bg-purple-500',
      category: '內容管理'
    },
    {
      title: '標籤管理',
      description: '管理 Blog 文章標籤',
      href: '/admin/blog/tags',
      icon: Hash,
      color: 'bg-pink-500',
      category: '內容管理'
    },

    // 🎯 提醒系統
    {
      title: '提醒管理',
      description: '設定課程學習提醒規則',
      href: '/admin/reminder-management',
      icon: Bell,
      color: 'bg-amber-500',
      category: '提醒系統'
    },

    // 作文管理
    {
      title: '作文管理',
      description: '批改和管理學生作文',
      href: '/admin/essays',
      icon: FileText,
      color: 'bg-purple-500',
      category: '作文管理'
    }
  ];

  // 按分類分組
  const groupedFunctions = adminFunctions.reduce((groups, func) => {
    const category = func.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(func);
    return groups;
  }, {} as Record<string, AdminFunction[]>);

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const FunctionCard = ({ func }: { func: AdminFunction }) => {
    const Icon = func.icon;
    return (
      <Link
        href={func.href}
        className="group bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-all hover:border-blue-300"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className={`p-3 rounded-lg ${func.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
              <Icon className={`w-6 h-6 ${func.color.replace('bg-', 'text-')}`} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {func.title}
              </h3>
              <p className="text-gray-600 text-sm mt-1">{func.description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </Link>
    );
  };

  // 簡潔的 Email 系統狀態指示器
  const EmailSystemStatusIndicator = () => {
    if (!emailSystemStatus) return null;

    const { isConfigured, emailStats } = emailSystemStatus;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-medium text-gray-900">Email 系統</span>
          </div>
          <div className="flex items-center gap-4">
            {/* 配置狀態 */}
            <div className="flex items-center">
              {isConfigured ? (
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${isConfigured ? 'text-green-700' : 'text-red-700'}`}>
                {isConfigured ? '已配置' : '未配置'}
              </span>
            </div>
            
            {/* 發送統計 */}
            {emailStats.total > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>總計: {emailStats.total}</span>
                <span className="text-green-600">成功: {emailStats.sent}</span>
                {emailStats.failed > 0 && (
                  <span className="text-red-600">失敗: {emailStats.failed}</span>
                )}
              </div>
            )}
            
            {/* 前往設定連結 */}
            <Link
              href="/admin/reminder-management"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              管理設定 →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理員儀表板</h1>
          <p className="text-gray-600">歡迎回來，管理您的線上課程平台</p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={BookOpen}
            title="總課程數"
            value={stats.totalCourses}
            color="bg-blue-500"
          />
          <StatCard
            icon={Users}
            title="總用戶數"
            value={stats.totalUsers}
            color="bg-green-500"
          />
          <StatCard
            icon={Brain}
            title="總測驗數"
            value={stats.totalQuizzes}
            color="bg-purple-500"
          />
          <StatCard
            icon={UserCheck}
            title="待審核申請"
            value={stats.pendingRequests}
            color="bg-orange-500"
          />
        </div>

        {/* 系統狀態指示器 */}
        <div className="mb-8">
          <EmailSystemStatusIndicator />
        </div>

        {/* 管理功能 */}
        <div className="space-y-8">
          {Object.entries(groupedFunctions).map(([category, functions]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                {category === '課程管理' && <BookOpen className="w-5 h-5 mr-2 text-blue-600" />}
                {category === '測驗系統' && <Brain className="w-5 h-5 mr-2 text-purple-600" />}
                {category === '用戶管理' && <Users className="w-5 h-5 mr-2 text-green-600" />}
                {category === '內容管理' && <FileText className="w-5 h-5 mr-2 text-teal-600" />}
                {category === '提醒系統' && <Bell className="w-5 h-5 mr-2 text-amber-600" />}
                {category === '作文管理' && <FileText className="w-5 h-5 mr-2 text-purple-600" />}
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {functions.map((func) => (
                  <FunctionCard key={func.href} func={func} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 最近活動 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            最近活動
          </h2>
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-900">{activity.title}</span>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/course-create"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-colors"
            >
              <Plus className="w-6 h-6 mb-2" />
              <h3 className="font-medium">建立新課程</h3>
              <p className="text-sm opacity-90">快速建立課程內容</p>
            </Link>
            <Link
              href="/admin/quiz-create"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-colors"
            >
              <Brain className="w-6 h-6 mb-2" />
              <h3 className="font-medium">建立新測驗</h3>
              <p className="text-sm opacity-90">設計測驗題目</p>
            </Link>
            <Link
              href="/admin/reminder-management"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-colors"
            >
              <Bell className="w-6 h-6 mb-2" />
              <h3 className="font-medium">設定提醒</h3>
              <p className="text-sm opacity-90">管理學習提醒</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}