'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('請輸入您的 Email 地址')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { getSupabase } = await import('@/lib/supabase')
      const supabase = getSupabase()

      const siteUrl = window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }

      setSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '發送重設信件失敗，請稍後再試'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-6">
          <Link
            href="/auth"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回登入
          </Link>
        </div>

        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">忘記密碼</h2>
          <p className="text-gray-600">
            輸入您註冊時使用的 Email，我們會寄送重設密碼的連結給您
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                重設信件已寄出
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                我們已將密碼重設連結寄送到 <strong>{email}</strong>。
                請檢查您的信箱（包含垃圾郵件資料夾），並點擊信中的連結來重設密碼。
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSent(false)
                    setEmail('')
                  }}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  使用其他 Email 重新發送
                </button>
                <Link
                  href="/auth"
                  className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
                >
                  返回登入頁面
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="請輸入您的 Email"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        發送中...
                      </span>
                    ) : (
                      '發送重設密碼信件'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  想起密碼了？
                  <Link href="/auth" className="ml-1 font-medium text-blue-600 hover:text-blue-500">
                    立即登入
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
