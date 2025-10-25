'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import VideoPlayer from '@/components/VideoPlayer'
import { LessonWithVideo, VideoProgress } from '@/lib/video-data'
import { 
  Play, 
  FileText, 
  CheckCircle, 
  Circle, 
  Clock, 
  Eye,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  TestTube,
  Video,
  PlayCircle,
  Star,
  Award,
  Menu,
  X,
  Bookmark
} from 'lucide-react'

interface LessonWithProgress extends LessonWithVideo {
  user_progress?: VideoProgress | null
}

export default function LayoutMatchedLearnPage() {
  const params = useParams()
  const courseId = params.courseId as string
  
  const [lessons, setLessons] = useState<LessonWithProgress[]>([])
  const [currentLesson, setCurrentLesson] = useState<LessonWithProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // 模擬用戶ID
  const userId = '36258aeb-f26d-406e-a8ed-25595a736614'

  useEffect(() => {
    loadLessons()
    checkAuth()
  }, [courseId])

  const checkAuth = () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('認證檢查錯誤:', error)
    }
  }

  const loadLessons = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseId}/lessons?user_id=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setLessons(data.lessons || [])
        // 設置第一個未完成的課程或第一個課程為當前課程
        const lessonsData = data.lessons || []
        const firstIncompleteLesson = lessonsData.find((lesson: any) => {
          return !lesson.user_progress || lesson.user_progress.progress_percentage < 100
        })
        setCurrentLesson(firstIncompleteLesson || lessonsData[0] || null)
      } else {
        console.error('載入課程單元失敗:', data.error)
      }
    } catch (error) {
      console.error('載入課程單元錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProgressUpdate = async (progress: VideoProgress) => {
    try {
      const response = await fetch('/api/video/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: progress.user_id,
          lesson_id: progress.lesson_id,
          current_time: progress.current_time,
          completed: progress.completed
        })
      })

      const data = await response.json()

      // 更新本地狀態
      setLessons(prev => prev.map(lesson => 
        lesson.id === progress.lesson_id 
          ? { ...lesson, user_progress: progress }
          : lesson
      ))
    } catch (error) {
      console.error('更新進度失敗:', error)
    }
  }

  const handleLessonComplete = () => {
    const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id)
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1])
    }
  }

  const switchToLesson = (lesson: LessonWithProgress) => {
    setCurrentLesson(lesson)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0 && remainingSeconds > 0) {
      return `${minutes} 分 ${remainingSeconds} 秒`
    } else if (minutes > 0) {
      return `${minutes} 分鐘`
    } else {
      return `${seconds} 秒`
    }
  }

  const getLessonProgress = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId)
    return lesson?.user_progress?.progress_percentage || 0
  }

  const isLessonCompleted = (lessonId: string) => {
    return getLessonProgress(lessonId) >= 100
  }

  const markLessonCompleted = (lessonId: string) => {
    setLessons(prev => prev.map(lesson => 
      lesson.id === lessonId 
        ? { 
            ...lesson, 
            user_progress: { 
              ...lesson.user_progress,
              user_id: userId,
              lesson_id: lessonId,
              progress_percentage: 100,
              completed: true,
              current_time: lesson.video_duration || 0
            } as VideoProgress
          }
        : lesson
    ))
  }

  // 渲染文字內容
  const renderTextContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-gray-900">{line.slice(2)}</h1>
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3 text-gray-900">{line.slice(3)}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium mt-4 mb-2 text-gray-900">{line.slice(4)}</h3>
      }
      if (line.includes('```')) {
        return (
          <pre key={index} className="bg-gray-100 border border-gray-200 rounded-lg p-4 overflow-x-auto my-4">
            <code className="text-gray-800">{line.replace(/```\w*\n?|\n?```/g, '')}</code>
          </pre>
        )
      }
      if (line.trim() === '') {
        return <br key={index} />
      }
      return <p key={index} className="mb-3 text-gray-700 leading-relaxed">{line}</p>
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入課程中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lessons.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">課程不存在</h1>
            <p className="text-gray-600 mb-6">找不到指定的課程內容</p>
            <Link 
              href="/courses" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回課程列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* 測試標識橫幅 */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-lg p-1.5">
              <TestTube className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <span className="text-gray-900 font-medium">🧪 影片功能測試模式</span>
              <span className="text-gray-600 text-sm ml-2">課程 ID: {courseId}</span>
            </div>
          </div>
          <Link 
            href={`/courses/${courseId}/learn`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回正式版
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* 側邊欄 */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-white shadow-lg`}>
          {/* 側邊欄頭部 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div>
                  <Link 
                    href={`/courses/${courseId}`}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    返回課程詳情
                  </Link>
                  <h2 className="font-semibold text-gray-900">課程單元</h2>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 課程列表 */}
          <div className="overflow-y-auto h-full pb-20">
            {lessons.map((lesson, index) => {
              const lessonProgress = getLessonProgress(lesson.id)
              const isCompleted = isLessonCompleted(lesson.id)
              const isCurrent = currentLesson?.id === lesson.id

              return (
                <button
                  key={lesson.id}
                  onClick={() => switchToLesson(lesson)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isCurrent ? 'bg-blue-50 border-r-4 border-r-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : lesson.lesson_type === 'video' ? (
                        <PlayCircle className="w-5 h-5 text-gray-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    {sidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCurrent ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {index + 1}. {lesson.title}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${lessonProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{Math.round(lessonProgress)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className="flex-1 flex flex-col">
          {currentLesson && (
            <>
              {/* 內容頭部 */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentLesson.title}
                    </h1>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="flex items-center mr-4">
                        {currentLesson.lesson_type === 'video' ? (
                          <PlayCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <FileText className="w-4 h-4 mr-1" />
                        )}
                        {currentLesson.lesson_type === 'video' ? '影片課程' : '文字課程'}
                      </span>
                      <span className="flex items-center mr-4">
                        <Clock className="w-4 h-4 mr-1" />
                        {currentLesson.video_duration ? 
                          `${formatDuration(currentLesson.video_duration)}` : 
                          '閱讀材料'
                        }
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        進度: {getLessonProgress(currentLesson.id)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Bookmark className="w-5 h-5" />
                    </button>
                    {!isLessonCompleted(currentLesson.id) && (
                      <button
                        onClick={() => markLessonCompleted(currentLesson.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        標記完成
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 課程內容 */}
              <div className="flex-1 overflow-y-auto p-6">
                {currentLesson.lesson_type === 'video' ? (
                  <div className="max-w-4xl mx-auto">
                    {/* 影片播放器 */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 mb-6">
                      <VideoPlayer
                        lesson={currentLesson}
                        userId={userId}
                        onProgressUpdate={handleProgressUpdate}
                        onComplete={handleLessonComplete}
                        className="w-full aspect-video"
                      />
                    </div>
                    
                    {/* 影片資訊 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Video className="h-5 w-5 mr-2 text-blue-600" />
                        影片詳情
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">影片來源：</span>
                          <span className="font-medium text-gray-900 ml-1">
                            {currentLesson.primary_video_type?.toUpperCase() || 'YouTube'}
                          </span>
                        </div>
                        {currentLesson.youtube_video_id && (
                          <div>
                            <span className="text-gray-600">YouTube ID：</span>
                            <span className="font-medium text-gray-900 ml-1 font-mono text-xs">
                              {currentLesson.youtube_video_id}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">可用來源：</span>
                          <span className="font-medium text-gray-900 ml-1">
                            {currentLesson.video_sources?.length || 1} 個
                          </span>
                        </div>
                      </div>
                      
                      {/* 課程描述 */}
                      {currentLesson.description && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">課程說明</h4>
                          <p className="text-gray-700">{currentLesson.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                      <div className="prose prose-lg max-w-none">
                        {currentLesson.content ? renderTextContent(currentLesson.content) : (
                          <p className="text-gray-500">沒有課程內容</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 底部導航 */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                  <button
                    onClick={() => {
                      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)
                      if (currentIndex > 0) {
                        switchToLesson(lessons[currentIndex - 1])
                      }
                    }}
                    disabled={lessons.findIndex(l => l.id === currentLesson.id) === 0}
                    className="flex items-center px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    上一個
                  </button>
                  
                  <span className="text-sm text-gray-500">
                    {lessons.findIndex(l => l.id === currentLesson.id) + 1} / {lessons.length}
                  </span>
                  
                  <button
                    onClick={() => {
                      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)
                      if (currentIndex < lessons.length - 1) {
                        switchToLesson(lessons[currentIndex + 1])
                      }
                    }}
                    disabled={lessons.findIndex(l => l.id === currentLesson.id) === lessons.length - 1}
                    className="flex items-center px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 transition-colors"
                  >
                    下一個
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}