'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
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
  UserCheck,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  User,
  TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth, AuthLoading, AuthError } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  category?: string;
  description?: string;
}

const navItems: NavItem[] = [
  // 主要頁面
  { title: '儀表板', href: '/admin', icon: Home },
  
  // 課程管理
  { title: '課程管理', href: '/admin/courses', icon: BookOpen, category: '課程管理' },
  { title: '建立課程', href: '/admin/course-create', icon: Plus, category: '課程管理' },
  
  // 測驗系統
  { title: '測驗管理', href: '/admin/quiz-settings', icon: Brain, category: '測驗系統' },
  { title: '建立測驗', href: '/admin/quiz-create', icon: Plus, category: '測驗系統' },
  { title: '批量上傳', href: '/admin/quiz-upload', icon: Upload, category: '測驗系統' },
  { title: '測驗結果', href: '/admin/quiz-results', icon: ClipboardList, category: '測驗系統' },
  { title: '測驗分析', href: '/admin/quiz-analytics', icon: BarChart3, category: '測驗系統' },
  
  // 用戶管理
  { title: '申請管理', href: '/admin/requests', icon: UserCheck, category: '用戶管理' },

  // 學習管理
  { title: '學習管理', href: '/admin/learning-management', icon: TrendingUp, category: '學習管理' },

  // 內容管理
  { title: 'Blog 管理', href: '/admin/blog', icon: FileText, category: '內容管理' },
  
  // 提醒系統
  { title: '提醒管理', href: '/admin/reminder-management', icon: Bell, category: '提醒系統' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error, isAuthenticated, isAdmin: userIsAdmin, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 點擊外部關閉用戶選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu') && userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // 檢查權限並處理未認證/無權限的情況
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/auth?redirect=' + encodeURIComponent(pathname));
      return;
    }

    if (!userIsAdmin) {
      router.push('/unauthorized');
      return;
    }
  }, [loading, isAuthenticated, userIsAdmin, router, pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 顯示載入畫面
  if (loading) {
    return <AuthLoading />;
  }

  // 顯示錯誤畫面
  if (error) {
    return <AuthError error={error} />;
  }

  // 如果未認證或無權限，返回 null（因為 useEffect 會處理重導向）
  if (!isAuthenticated || !userIsAdmin) {
    return null;
  }

  // 生成麵包屑
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // 總是包含首頁
    breadcrumbs.push({ title: '首頁', href: '/' });

    // 如果在 admin 路徑下
    if (pathSegments[0] === 'admin') {
      breadcrumbs.push({ title: '管理員', href: '/admin' });

      // 查找當前頁面
      const currentNavItem = navItems.find(item => item.href === pathname);
      if (currentNavItem && pathname !== '/admin') {
        breadcrumbs.push({ title: currentNavItem.title, href: pathname });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // 獲取當前頁面標題
  const getCurrentPageTitle = () => {
    const currentNavItem = navItems.find(item => item.href === pathname);
    return currentNavItem?.title || '管理員';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航欄 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 左側：Logo 和標題 */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-6">
                <BookOpen className="w-8 h-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">學習平台</span>
              </Link>
              
              {/* 移動端選單按鈕 */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* 右側：用戶資訊和快速導航 */}
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                返回首頁
              </Link>
              
              {/* 用戶選單 */}
              {user && (
                <div className="relative user-menu">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:block">{user.email}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      管理員
                    </span>
                  </button>
                  
                  {/* 下拉選單 */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          <div className="font-medium">{user.email}</div>
                          <div className="text-xs text-gray-500">管理員</div>
                        </div>
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          管理後台
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleSignOut();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 inline mr-2" />
                          登出
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex">
        {/* 側邊欄 (桌面版) */}
        <div className="hidden md:block w-64 py-6 pr-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">管理功能</h3>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className="flex-1 py-6">
          {/* 麵包屑導航 */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
                  <Link
                    href={crumb.href}
                    className={`hover:text-gray-900 ${
                      index === breadcrumbs.length - 1 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-600'
                    }`}
                  >
                    {crumb.title}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* 頁面標題 */}
          {pathname !== '/admin' && (
            <div className="mb-6 flex items-center">
              <Link
                href="/admin"
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="返回管理員首頁"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {getCurrentPageTitle()}
              </h1>
            </div>
          )}

          {/* 頁面內容 */}
          {children}
        </div>
      </div>

      {/* 移動端側邊欄 */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">管理功能</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}