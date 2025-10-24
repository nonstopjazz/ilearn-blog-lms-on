'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  fullName: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 檢查本地存儲的登入狀態
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error('讀取用戶資料失敗:', error)
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // 登入函數
  const login = async (email: string, _password: string) => {
    try {
      // 這裡應該呼叫你的 API
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // })

      // 模擬 API 請求
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 模擬登入成功
      const userData: User = {
        id: '36258aeb-f26d-406e-a8ed-25595a736614',
        email: email,
        fullName: '測試用戶'
      }

      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      console.error('登入失敗:', error)
      throw new Error('登入失敗，請檢查您的帳號密碼')
    }
  }

  // 註冊函數
  const register = async (email: string, password: string, fullName: string) => {
    try {
      // 這裡應該呼叫你的 API
      // const { data, error } = await supabase.auth.signUp({
      //   email,
      //   password,
      //   options: {
      //     data: {
      //       full_name: fullName,
      //     }
      //   }
      // })

      // 模擬 API 請求
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 註冊成功後不自動登入，讓用戶手動登入
      console.log('註冊成功:', { email, fullName })
    } catch (error) {
      console.error('註冊失敗:', error)
      throw new Error('註冊失敗，請稍後再試')
    }
  }

  // 登出函數
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    
    // 這裡應該呼叫你的 API
    // await supabase.auth.signOut()
  }

  // 更新用戶資料
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // 如果沒有找到 context，返回一個默認值而不是拋出錯誤
    console.warn('useAuth must be used within an AuthProvider')
    return {
      user: null,
      loading: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      updateUser: () => {}
    }
  }
  return context
}

// 高階組件：需要登入才能訪問的頁面
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      // 重定向到登入頁面
      if (typeof window !== 'undefined') {
        window.location.href = '/auth'
      }
      return null
    }

    return <Component {...props} />
  }
}