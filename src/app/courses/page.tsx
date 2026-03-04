'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Users, Star, Play, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'

// 課程資料類型 - 對應真實 API 資料結構
interface Course {
  id: string
  title: string
  description: string
  short_description?: string
  instructor_name: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  lessons_count: number
  duration_minutes: number
  price: number
  status: string
  rating?: number
  enrolled_count?: number
  created_at: string
  updated_at: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 🔥 從真實 API 載入課程，只顯示已發布的課程
      console.log('開始載入課程...')
      const response = await fetch('/api/courses?status=published')
      
      console.log('API 回應狀態:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API 錯誤回應:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }
      
      const result = await response.json()
      console.log('API 回應資料:', result)
      
      if (result.success) {
        // 為了兼容性，添加一些前端需要的欄位
        const coursesWithDefaults = result.courses.map((course: Course) => ({
          ...course,
          enrolled_count: course.enrolled_count ?? 0,
          rating: course.rating ?? 0,
        }))
        
        setCourses(coursesWithDefaults)
      } else {
        console.error('API 回傳錯誤:', result.error)
        setError(result.error || '載入課程失敗')
      }
      
    } catch (error) {
      console.error('載入課程失敗:', error)
      setError('載入課程失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  // 獲取難度顏色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 獲取難度標籤
  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return '初級'
      case 'intermediate':
        return '中級'
      case 'advanced':
        return '高級'
      default:
        return level
    }
  }

  // 格式化時長
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
  }

  // 格式化價格
  const formatPrice = (price: number) => {
    if (price === 0) return '免費'
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
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
        <Navbar />
        <div className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <BookOpen className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">載入課程失敗</h3>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={loadCourses}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* 頁面標題 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              探索我們的課程
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              從基礎到進階，提升你的技術技能
            </p>
          </div>

          {/* 課程網格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div 
                key={course.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* 課程頭部 */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                      {getLevelLabel(course.level)}
                    </span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">{course.rating?.toFixed(1)}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.short_description || course.description}
                  </p>

                  <div className="text-xs text-gray-500 mb-4">
                    <div className="mb-1">講師：{course.instructor_name}</div>
                    <div>{course.category}</div>
                  </div>

                  {/* 價格顯示 */}
                  <div className="mb-4">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(course.price)}
                    </span>
                  </div>
                </div>

                {/* 課程統計 */}
                <div className="px-6 py-3 bg-gray-50 border-t">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.lessons_count} 課程
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(course.duration_minutes)}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.enrolled_count?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="p-6 pt-4">
                  <Link
                    href={`/courses/${course.id}`}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    查看課程
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* 如果沒有課程 */}
          {courses.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                目前沒有可用的課程
              </h3>
              <p className="text-gray-600">
                課程正在準備中，敬請期待
              </p>
            </div>
          )}

          {/* 課程統計資訊 */}
          {courses.length > 0 && (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                    <div className="text-sm text-gray-600">門課程</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">位學員</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(courses.reduce((sum, course) => sum + (course.duration_minutes || 0), 0) / 60)}
                    </div>
                    <div className="text-sm text-gray-600">小時內容</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}