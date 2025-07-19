'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })

  // 🔧 新增：獲取 redirect 參數
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  // 🔧 新增：檢查是否已經登入
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // 如果已經登入，直接重定向
          const targetUrl = redirectUrl || '/'
          window.location.href = targetUrl
        }
      } catch (error) {
        console.error('Auth check error:', error)
      }
    }

    checkAuth()
  }, [redirectUrl])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  // 🔧 修復：使用 Supabase Auth 登入
  const handleLogin = async (email: string, password: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data.user
    } catch (error) {
      throw error
    }
  }

  // 🔧 修復：使用 Supabase Auth 註冊
  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('請填寫所有必填欄位')
      return
    }

    if (!isLogin && !formData.fullName) {
      setError('請輸入姓名')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await handleLogin(formData.email, formData.password)
        
        // 🔧 修復：登入成功後根據 redirect 參數重定向
        const targetUrl = redirectUrl || '/'
        window.location.href = targetUrl
      } else {
        await handleRegister(formData.email, formData.password, formData.fullName)
        
        // 註冊成功後切換到登入模式
        setIsLogin(true)
        setFormData({ email: formData.email, password: '', fullName: '' })
        setError('')
        alert('註冊成功！請檢查您的信箱並驗證帳戶，然後登入。')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || (isLogin ? '登入失敗' : '註冊失敗'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 返回首頁 */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Link>
        </div>

        {/* Logo 和標題 */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? '登入您的帳戶' : '建立新帳戶'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? '歡迎回到學習平台' : '開始您的學習旅程'}
          </p>
          
          {/* 🔧 新增：顯示重定向提示 */}
          {redirectUrl && (
            <p className="text-sm text-blue-600 mt-2">
              登入後將返回到：{redirectUrl.includes('reminder-preferences') ? '提醒設定頁面' : 
                            redirectUrl.includes('quiz') ? '測驗頁面' : 
                            redirectUrl.includes('courses') ? '課程頁面' : '您訪問的頁面'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 表單 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 姓名欄位 (註冊時顯示) */}
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  姓名
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="請輸入您的姓名"
                  />
                </div>
              </div>
            )}

            {/* Email 欄位 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email 地址
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="請輸入您的 Email"
                />
              </div>
            </div>

            {/* 密碼欄位 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="請輸入您的密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 提交按鈕 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    {isLogin ? '登入中...' : '註冊中...'}
                  </span>
                ) : (
                  isLogin ? '登入' : '註冊'
                )}
              </button>
            </div>
          </form>

          {/* 切換登入/註冊 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? '還沒有帳戶？' : '已經有帳戶了？'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setFormData({ email: '', password: '', fullName: '' })
                }}
                className="ml-1 font-medium text-blue-600 hover:text-blue-500"
              >
                {isLogin ? '立即註冊' : '立即登入'}
              </button>
            </p>
          </div>

          {/* 🔧 新增：測試用帳號提示 */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              <strong>測試提示：</strong>如果這是開發環境，請確保 Supabase 設定正確。<br/>
              註冊後需要驗證信箱才能登入。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}