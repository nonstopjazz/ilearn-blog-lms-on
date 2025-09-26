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


  // 🔧 修復：Supabase Auth 認證檢查
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        
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
      const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
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
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        
        // 步驟 1: 查詢用戶已批准的課程申請
        const { data: approvedRequests, error: requestError } = await supabase
          .from('course_requests')
          .select('course_id, course_title, reviewed_at')
          .eq('user_id', user.id)
          .eq('status', 'approved')
        
        if (requestError) {
          console.error('[My Courses] 查詢課程申請失敗:', requestError)
          setError('載入課程時發生錯誤')
          return
        }
        
        if (!approvedRequests || approvedRequests.length === 0) {
          setCourses([])
          setProgress([])
          return
        }
        
        // 步驟 2: 獲取課程詳細資訊
        const courseIds = approvedRequests.map(req => req.course_id)
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, description, category, level, lessons_count, status')
          .in('id', courseIds)
        
        if (coursesError) {
          console.error('查詢課程詳情失敗:', coursesError)
        }
        
        // 建立課程 ID 到課程資料的映射
        const coursesMap = new Map()
        if (coursesData) {
          coursesData.forEach(course => {
            coursesMap.set(course.id, course)
          })
        }
        
        // 整理課程資料（顯示所有已批准的課程，除了明確標記為 draft 的）
        console.log('=== 課程資料分析 ===')
        console.log('已批准的課程申請數量:', approvedRequests.length)
        console.log('courses 表中找到的課程數量:', coursesData ? coursesData.length : 0)

        if (coursesData && coursesData.length > 0) {
          console.log('courses 表中的課程狀態分布:')
          coursesData.forEach(course => {
            console.log(`- ${course.id}: status = ${course.status || 'undefined/null'}`)
          })
        }

        const userCoursesData = approvedRequests
          .map(req => {
            const courseDetail = coursesMap.get(req.course_id)

            // 如果課程不在 courses 表中，還是顯示（使用 course_requests 的資料）
            if (!courseDetail) {
              console.log(`課程 ${req.course_id} 不在 courses 表中，使用 course_requests 資料顯示`)
              return {
                id: req.course_id,
                title: req.course_title,
                description: '',
                category: '未分類',
                difficulty: '初級',
                total_lessons: 0
              }
            }

            // 只過濾明確標記為 draft 的課程
            // 如果 status 是 undefined、null 或其他值，都顯示
            if (courseDetail.status === 'draft') {
              console.log(`課程 ${req.course_id} 狀態為 draft，不顯示`)
              return null
            }

            // 顯示課程
            console.log(`顯示課程 ${req.course_id}，狀態：${courseDetail.status || 'undefined/null'}，標題：${courseDetail.title}`)
            return {
              id: req.course_id,
              title: courseDetail.title || req.course_title,
              description: courseDetail.description || '',
              category: courseDetail.category || '未分類',
              difficulty: courseDetail.level === 'beginner' ? '初級' :
                          courseDetail.level === 'intermediate' ? '中級' : '高級',
              total_lessons: courseDetail.lessons_count || 0
            }
          })
          .filter(course => course !== null) // 移除 null 值（draft 課程）

        console.log('最終顯示的課程數量:', userCoursesData.length)
        console.log('===================')
        
        setCourses(userCoursesData)
        
        // 暫時設定空的進度資料
        const mockProgress = userCoursesData.map(course => ({
          course_id: course.id,
          progress_percent: 0,
          completed_lessons: 0,
          total_lessons: course.total_lessons,
          last_accessed: new Date().toISOString().split('T')[0]
        }))
        
        setProgress(mockProgress)
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