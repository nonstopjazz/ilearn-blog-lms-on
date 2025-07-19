'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Award, TrendingUp, Play, CheckCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'

interface User {
  id: string
  email: string
  fullName: string
}

interface Course {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  total_lessons: number
}

interface CourseProgress {
  course_id: string
  progress_percent: number
  completed_lessons: number
  total_lessons: number
  last_accessed: string
  next_lesson_id?: string
  next_lesson_title?: string
}

export default function MyCoursesPage() {
  // 🔧 修復：使用 Supabase Auth 用戶狀態管理
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [progress, setProgress] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 模擬用戶課程資料
  const userCourses: Course[] = [
    {
      id: 'course_001',
      title: 'React 基礎課程',
      description: '從零開始學習 React，包含組件、狀態管理、生命週期等核心概念。',
      category: '前端開發',
      difficulty: '初級',
      total_lessons: 4
    },
    {
      id: 'course_002', 
      title: 'JavaScript 進階',
      description: '深入學習 JavaScript ES6+ 特性，包含異步程式設計、模組系統等。',
      category: '程式語言',
      difficulty: '中級',
      total_lessons: 2
    },
    {
      id: 'course_013',
      title: 'React 進階開發',
      description: '學習 React 的進階概念，包含 Context API、性能優化、測試等。',
      category: '前端開發',
      difficulty: '高級',
      total_lessons: 2
    }
  ]

  // 模擬進度資料
  const userProgress: CourseProgress[] = [
    {
      course_id: 'course_001',
      progress_percent: 75,
      completed_lessons: 3,
      total_lessons: 4,
      last_accessed: '2025-07-14',
      next_lesson_id: 'lesson_001_04',
      next_lesson_title: 'State 和生命週期'
    },
    {
      course_id: 'course_002',
      progress_percent: 50,
      completed_lessons: 1,
      total_lessons: 2,
      last_accessed: '2025-07-13',
      next_lesson_id: 'lesson_002_02',
      next_lesson_title: '箭頭函數與解構賦值'
    },
    {
      course_id: 'course_013',
      progress_percent: 0,
      completed_lessons: 0,
      total_lessons: 2,
      last_accessed: '2025-07-12',
      next_lesson_id: 'lesson_013_01',
      next_lesson_title: 'React 進階概念介紹'
    }
  ]

  // 🔧 修復：Supabase Auth 認證檢查
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        
        // 檢查當前用戶
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // 監聽認證狀態變化
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setUserLoading(false)
      }
    }

    checkAuth()
  }, [])

  // 🔧 修復：訪客友善設計 - 如果未登入則重定向
  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = '/auth?redirect=/my-courses'
    }
  }, [user, userLoading])

  // 🔧 修復：登出處理
  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // 載入課程資料
  useEffect(() => {
    const loadUserCourses = async () => {
      if (!user) return

      try {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 800))
        setCourses(userCourses)
        setProgress(userProgress)
      } catch (err) {
        console.error('載入課程失敗:', err)
        setError('載入課程時發生錯誤')
      } finally {
        setLoading(false)
      }
    }

    loadUserCourses()
  }, [user])

  // 獲取課程進度
  const getCourseProgress = (courseId: string) => {
    return progress.find(p => p.course_id === courseId)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      month: 'long',
      day: 'numeric'
    })
  }

  // 獲取難度顏色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '初級':
        return 'bg-green-100 text-green-800'
      case '中級':
        return 'bg-yellow-100 text-yellow-800'
      case '高級':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 計算總體學習統計
  const totalLessons = progress.reduce((sum, p) => sum + p.total_lessons, 0)
  const completedLessons = progress.reduce((sum, p) => sum + p.completed_lessons, 0)
  const averageProgress = progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + p.progress_percent, 0) / progress.length)
    : 0

  // 🔧 修復：如果還在檢查認證狀態，顯示載入
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">檢查登入狀態...</p>
        </div>
      </div>
    )
  }

  // 🔧 修復：如果用戶未登入，顯示重定向訊息
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">正在重定向到登入頁面...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onSignOut={handleSignOut} />
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
                ))}
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onSignOut={handleSignOut} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">載入失敗</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onSignOut={handleSignOut} />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">我的課程</h1>
            <p className="text-gray-600">繼續你的學習旅程，追蹤學習進度</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                  <p className="text-gray-600">已註冊課程</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedLessons}/{totalLessons}</p>
                  <p className="text-gray-600">已完成課程</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
                  <p className="text-gray-600">平均進度</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {courses.map((course) => {
              const courseProgress = getCourseProgress(course.id)
              const progressPercent = courseProgress?.progress_percent || 0
              const isCompleted = progressPercent >= 100
              
              return (
                <div key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 mr-3">
                            {course.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{course.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-4">{course.category}</span>
                          {courseProgress && (
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              上次學習：{formatDate(courseProgress.last_accessed)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {isCompleted && (
                          <div className="flex items-center text-green-600">
                            <Award className="w-5 h-5 mr-1" />
                            <span className="text-sm font-medium">已完成</span>
                          </div>
                        )}
                        <Link
                          href={`/courses/${course.id}/learn`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {progressPercent > 0 ? '繼續學習' : '開始學習'}
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          進度：{courseProgress?.completed_lessons || 0} / {courseProgress?.total_lessons || 0} 課程
                        </span>
                        <span className="font-medium text-gray-900">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      
                      {courseProgress?.next_lesson_title && progressPercent < 100 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">下一課程：</span>
                            {courseProgress.next_lesson_title}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                還沒有註冊任何課程
              </h3>
              <p className="text-gray-600 mb-6">
                瀏覽我們的課程目錄，開始你的學習旅程
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                瀏覽課程
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}