'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, Settings, BookOpen, FileText, Brain, Users, Bell, Key } from 'lucide-react'
import NotificationCenter from './NotificationCenter'

interface NavbarProps {
  user?: any
  onSignOut?: () => void
}

export default function Navbar({ user: propUser, onSignOut }: NavbarProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(propUser || null)
  const [loading, setLoading] = useState(!propUser)
  const router = useRouter()
  const pathname = usePathname()

  // 🔧 修復：完全使用 Supabase Auth，移除 localStorage 邏輯
  useEffect(() => {
    if (propUser) {
      setUser(propUser)
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase')
        const supabase = getSupabase()
        
        // 檢查當前用戶
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // 監聽認證狀態變化
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('檢查認證狀態時出錯:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [propUser])

  // 🔧 修復：使用 Supabase Auth 登出
  const handleLogout = async () => {
    try {
      if (onSignOut) {
        onSignOut()
      } else {
        const { getSupabase } = await import('@/lib/supabase')
        const supabase = getSupabase()
        await supabase.auth.signOut()
        setUser(null)
        router.push('/')
      }
    } catch (error) {
      console.error('登出時出錯:', error)
    }
  }

  const navItems = [
    { name: '課程', href: '/courses', icon: BookOpen },
    { name: '學習管理', href: '/learning', icon: Users },
    { name: 'Blog', href: '/blog', icon: FileText },
    { name: '測驗', href: '/quiz', icon: Brain }
  ]

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">iLearn</span>
            </Link>
          </div>

          {/* 桌面版導航 */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* 用戶選單 */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* 通知中心 - 只在用戶登入時顯示 */}
                <NotificationCenter 
                  userId={user.id} 
                  className="flex-shrink-0"
                />
                
                {/* 🔧 修復：檢查 user.user_metadata 或 user.role */}
                {(user.user_metadata?.role === 'admin' || user.role === 'admin') && (
                  <>
                    <Link
                      href="/admin"
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>管理面板</span>
                    </Link>
                    <Link
                      href="/admin/reminder-management"
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActivePath('/admin/reminder-management')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                      <span>提醒管理</span>
                    </Link>
                  </>
                )}
                
                <Link
                  href="/my-courses"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>我的課程</span>
                </Link>
                
                <Link
                  href="/settings/change-password"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  <Key className="h-4 w-4" />
                  <span>修改密碼</span>
                </Link>

                <Link
                  href="/user/reminder-preferences"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/user/reminder-preferences')
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>提醒設定</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>登出</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth?mode=login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  登入
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  註冊
                </Link>
              </div>
            )}
          </div>

          {/* 手機版選單按鈕和通知 */}
          <div className="md:hidden flex items-center space-x-2">
            {/* 手機版通知中心 - 只在用戶登入時顯示 */}
            {user && (
              <NotificationCenter 
                userId={user.id} 
                className="flex-shrink-0"
              />
            )}
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 手機版選單 */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActivePath(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            <div className="border-t pt-2 mt-2">
              {user ? (
                <>
                  {/* 🔧 修復：檢查管理員權限 */}
                  {(user.user_metadata?.role === 'admin' || user.role === 'admin') && (
                    <>
                      <Link
                        href="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-5 w-5" />
                        <span>管理面板</span>
                      </Link>
                      <Link
                        href="/admin/reminder-management"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActivePath('/admin/reminder-management')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Bell className="h-5 w-5" />
                        <span>提醒管理</span>
                      </Link>
                    </>
                  )}
                  
                  <Link
                    href="/my-courses"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>我的課程</span>
                  </Link>
                  
                  <Link
                    href="/settings/change-password"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    <Key className="h-5 w-5" />
                    <span>修改密碼</span>
                  </Link>

                  <Link
                    href="/user/reminder-preferences"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActivePath('/user/reminder-preferences')
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>提醒設定</span>
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>登出</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth?mode=login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    登入
                  </Link>
                  <Link
                    href="/auth?mode=register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    註冊
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}