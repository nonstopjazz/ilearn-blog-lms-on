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
  Video,
  PlayCircle,
  Star,
  Award,
  Menu,
  X,
  Bookmark,
  Download,
  Paperclip,
  ExternalLink,
  FileImage,
  Music,
  Archive,
  Film,
  File
} from 'lucide-react'

interface User {
  id: string
  email: string
  fullName: string
}

interface FileAttachment {
  name: string
  url: string
  type?: 'pdf' | 'word' | 'excel' | 'image' | 'audio' | 'video' | 'archive' | 'other'
  size?: string
  description?: string
}

interface LessonWithProgress extends LessonWithVideo {
  user_progress?: VideoProgress | null
  attachments?: FileAttachment[]
}

// 🎨 檔案類型偵測函數
const detectFileType = (url: string, fileName: string): 'pdf' | 'word' | 'excel' | 'image' | 'audio' | 'video' | 'archive' | 'other' => {
  const lowerName = fileName.toLowerCase()
  const lowerUrl = url.toLowerCase()
  
  // PDF 檔案
  if (lowerName.includes('.pdf') || lowerUrl.includes('pdf')) return 'pdf'
  
  // Word 檔案
  if (lowerName.match(/\.(doc|docx)$/) || lowerUrl.includes('document')) return 'word'
  
  // Excel 檔案
  if (lowerName.match(/\.(xls|xlsx)$/) || lowerUrl.includes('spreadsheet')) return 'excel'
  
  // 圖片檔案
  if (lowerName.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/)) return 'image'
  
  // 音檔
  if (lowerName.match(/\.(mp3|wav|m4a|aac|flac|ogg)$/)) return 'audio'
  
  // 影片檔案
  if (lowerName.match(/\.(mp4|avi|mkv|mov|wmv|flv|webm)$/)) return 'video'
  
  // 壓縮檔案
  if (lowerName.match(/\.(zip|rar|7z|tar|gz)$/)) return 'archive'
  
  return 'other'
}

// 🎨 美化的附件卡片組件
const AttachmentCard: React.FC<{ file: FileAttachment }> = ({ file }) => {
  const fileType = file.type || detectFileType(file.url, file.name)
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': 
        return { 
          icon: <FileText className="w-8 h-8" />, 
          color: 'bg-red-50 border-red-200', 
          textColor: 'text-red-700',
          bgColor: 'bg-red-100',
          accent: 'border-red-400'
        }
      case 'word': 
        return { 
          icon: <FileText className="w-8 h-8" />, 
          color: 'bg-blue-50 border-blue-200', 
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-100',
          accent: 'border-blue-400'
        }
      case 'excel': 
        return { 
          icon: <FileText className="w-8 h-8" />, 
          color: 'bg-green-50 border-green-200', 
          textColor: 'text-green-700',
          bgColor: 'bg-green-100',
          accent: 'border-green-400'
        }
      case 'image': 
        return { 
          icon: <FileImage className="w-8 h-8" />, 
          color: 'bg-purple-50 border-purple-200', 
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-100',
          accent: 'border-purple-400'
        }
      case 'audio': 
        return { 
          icon: <Music className="w-8 h-8" />, 
          color: 'bg-yellow-50 border-yellow-200', 
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          accent: 'border-yellow-400'
        }
      case 'video': 
        return { 
          icon: <Film className="w-8 h-8" />, 
          color: 'bg-indigo-50 border-indigo-200', 
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-100',
          accent: 'border-indigo-400'
        }
      case 'archive': 
        return { 
          icon: <Archive className="w-8 h-8" />, 
          color: 'bg-orange-50 border-orange-200', 
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-100',
          accent: 'border-orange-400'
        }
      default: 
        return { 
          icon: <File className="w-8 h-8" />, 
          color: 'bg-gray-50 border-gray-200', 
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-100',
          accent: 'border-gray-400'
        }
    }
  }

  const fileStyle = getFileIcon(fileType)

  return (
    <div className={`${fileStyle.color} border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:${fileStyle.accent} group`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* 檔案圖示 */}
          <div className={`${fileStyle.bgColor} p-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
            {fileStyle.icon}
          </div>
          
          {/* 檔案資訊 */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${fileStyle.textColor} truncate text-lg group-hover:text-opacity-90`}>
              {file.name}
            </h4>
            
            {/* 檔案描述 */}
            {file.description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2 group-hover:text-gray-700">
                {file.description}
              </p>
            )}
            
            {/* 檔案資訊 */}
            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-2">
              <span className={`${fileStyle.bgColor} ${fileStyle.textColor} px-2 py-1 rounded-full uppercase font-medium text-xs`}>
                {fileType}
              </span>
              {file.size && (
                <>
                  <span>•</span>
                  <span className="font-medium">{file.size}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* 操作按鈕 */}
        <div className="flex items-center space-x-2 ml-4">
          {/* 特殊操作按鈕 */}
          {fileType === 'audio' && (
            <button
              onClick={() => window.open(file.url, '_blank')}
              className="p-3 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
              title="播放音檔"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
          {fileType === 'image' && (
            <button
              onClick={() => window.open(file.url, '_blank')}
              className="p-3 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
              title="預覽圖片"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {fileType === 'video' && (
            <button
              onClick={() => window.open(file.url, '_blank')}
              className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
              title="播放影片"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
          
          {/* 下載按鈕 */}
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-3 ${fileStyle.textColor} hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors group-hover:scale-110 transform duration-200`}
            title="下載檔案"
          >
            <Download className="w-5 h-5" />
          </a>
          
          {/* 外部連結按鈕 */}
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 text-gray-600 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
            title="在新視窗開啟"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  )
}

export default function CourseLearnPage() {
  // 🔧 修正：只使用 useParams() 獲取路由參數
  const params = useParams()
  const courseId = params.courseId as string
  
   // 🔍 加入除錯代碼
  console.log('🔍 useParams() 結果:', params)
  console.log('🔍 courseId 值:', courseId)
  console.log('🔍 courseId 類型:', typeof courseId)

  // 🔧 修復：使用 Supabase Auth 用戶狀態管理
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [lessons, setLessons] = useState<LessonWithProgress[]>([])
  const [currentLesson, setCurrentLesson] = useState<LessonWithProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // 🔧 修復：Supabase Auth 認證檢查
  useEffect(() => {
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
      window.location.href = `/auth?redirect=/courses/${courseId}/learn`
    }
  }, [user, userLoading, courseId])

  // 🔧 修復：登出處理
  const handleSignOut = async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase')
      const supabase = getSupabase()
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // 載入課程資料
  useEffect(() => {
    const loadCourseData = async () => {
      if (!user || !courseId) return

      try {
        setLoading(true)
        console.log('🚀 開始載入課程資料:', courseId)
        
        // 🔧 修正：直接使用 API 路由
        const response = await fetch(`/api/courses/${courseId}/lessons?user_id=${user.id}`)
        const data = await response.json()
        
        console.log('🔍 API 回應:', data)
        
        if (response.ok && data.success) {
          console.log('✅ 開始處理附件資料...')
          
          // 🎨 改善附件資料處理，自動偵測檔案類型
          const processedLessons = (data.lessons || []).map((lesson: any) => {
            console.log('🔍 處理課程單元:', lesson.title, '原始附件資料:', lesson.attachments)
            
            let attachments = []
            
            // 處理各種附件資料格式
            if (lesson.attachments) {
              console.log('🔍 附件資料類型:', typeof lesson.attachments)
              
              if (Array.isArray(lesson.attachments)) {
                console.log('✅ 附件是陣列格式')
                attachments = lesson.attachments.map((item, index) => {
                  if (typeof item === 'string') {
                    const fileName = `附件 ${index + 1}`
                    return {
                      name: fileName,
                      url: item,
                      type: detectFileType(item, fileName),
                      size: '',
                      description: ''
                    }
                  }
                  // 確保檔案類型正確
                  return {
                    ...item,
                    type: item.type || detectFileType(item.url, item.name)
                  }
                })
              } else if (typeof lesson.attachments === 'string') {
                console.log('✅ 附件是字串格式，嘗試解析')
                try {
                  const parsed = JSON.parse(lesson.attachments)
                  console.log('✅ 解析成功:', parsed)
                  if (Array.isArray(parsed)) {
                    attachments = parsed.map((item, index) => {
                      if (typeof item === 'string') {
                        const fileName = `附件 ${index + 1}`
                        return {
                          name: fileName,
                          url: item,
                          type: detectFileType(item, fileName),
                          size: '',
                          description: ''
                        }
                      }
                      return {
                        ...item,
                        type: item.type || detectFileType(item.url, item.name)
                      }
                    })
                  }
                } catch (e) {
                  console.error('❌ JSON 解析失敗:', e)
                  attachments = []
                }
              } else if (typeof lesson.attachments === 'object' && lesson.attachments !== null) {
                console.log('✅ 附件是物件格式')
                attachments = [{
                  ...lesson.attachments,
                  type: lesson.attachments.type || detectFileType(lesson.attachments.url, lesson.attachments.name)
                }]
              }
            }
            
            console.log('🔍 處理後的附件資料:', attachments)
            
            return {
              ...lesson,
              attachments
            }
          })
          
          console.log('🔍 所有處理後的課程單元:', processedLessons)
          setLessons(processedLessons)
          
          // 設置第一個未完成的課程或第一個課程為當前課程
          const firstIncompleteLesson = processedLessons.find((lesson: any) => {
            return !lesson.user_progress || lesson.user_progress.progress_percentage < 100
          })
          
          const selectedLesson = firstIncompleteLesson || processedLessons[0] || null
          console.log('🎯 選中的當前課程:', selectedLesson?.title, '附件數量:', selectedLesson?.attachments?.length)
          console.log('🎯 選中課程的附件明細:', selectedLesson?.attachments)
          setCurrentLesson(selectedLesson)
          
        } else {
          console.error('❌ 載入課程單元失敗:', data.error)
          
          // 🔧 如果 API 失敗，使用 Supabase 直接查詢作為備用方案
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          
          console.log('🔧 使用 Supabase 直接查詢作為備用方案...')
          
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('course_lessons')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true })
          
          if (lessonsError) {
            console.error('❌ 直接查詢課程單元失敗:', lessonsError)
            return
          }
          
          console.log('✅ 直接查詢到的課程單元:', lessonsData)
          
          // 查詢用戶進度
          const { data: progressData } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id, progress_percentage, completed, current_time')
            .eq('user_id', user.id)
            .in('lesson_id', lessonsData?.map(l => l.id) || [])
          
          // 組合資料
          const backupLessons = lessonsData?.map(lesson => ({
            ...lesson,
            user_progress: progressData?.find(p => p.lesson_id === lesson.id) ? {
              user_id: user.id,
              lesson_id: lesson.id,
              progress_percentage: progressData.find(p => p.lesson_id === lesson.id)?.progress_percentage || 0,
              completed: progressData.find(p => p.lesson_id === lesson.id)?.completed || false,
              current_time: progressData.find(p => p.lesson_id === lesson.id)?.current_time || 0
            } : null
          })) || []
          
          setLessons(backupLessons)
          setCurrentLesson(backupLessons[0] || null)
        }
        
      } catch (error) {
        console.error('💥 載入課程資料失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourseData()
  }, [courseId, user])

  // 處理沒有課程單元的情況 - 重導向邏輯（移除重複邏輯）
  // 這個邏輯已移到下方的 render 部分，避免重複執行

  // 處理進度更新
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

  // 課程完成處理
  const handleLessonComplete = () => {
    const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id)
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1])
    }
  }

  // 獲取課程進度
  const getLessonProgress = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId)
    return lesson?.user_progress?.progress_percentage || 0
  }

  // 檢查課程是否完成
  const isLessonCompleted = (lessonId: string) => {
    return getLessonProgress(lessonId) >= 100
  }

  // 切換課程
  const switchToLesson = (lesson: LessonWithProgress) => {
    console.log('切換到課程:', lesson.title, '附件數量:', lesson.attachments?.length)
    setCurrentLesson(lesson)
  }

  // 標記課程完成
  const markLessonCompleted = (lessonId: string) => {
    setLessons(prev => prev.map(lesson => 
      lesson.id === lessonId 
        ? { 
            ...lesson, 
            user_progress: { 
              user_id: user.id,
              lesson_id: lessonId,
              progress_percentage: 100,
              completed: true,
              current_time: lesson.video_duration || 0
            } as VideoProgress
          }
        : lesson
    ))
  }

  // 格式化時間
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} 分鐘`
  }

  // 🎨 改善的附件列表渲染函數
  const renderAttachments = (attachments: FileAttachment[]) => {
    console.log('🔍 渲染附件:', attachments)
  
    if (!attachments || attachments.length === 0) {
      console.log('❌ 沒有附件資料')
      return (
        <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
          <div className="text-center">
            <div className="text-6xl mb-4">📎</div>
            <h4 className="font-semibold text-yellow-800 mb-2">課程附件</h4>
            <p className="text-sm text-yellow-700">此課程單元暫無附件檔案</p>
          </div>
        </div>
      )
    }

    console.log('✅ 顯示', attachments.length, '個附件')

    return (
      <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-gray-900 flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <Paperclip className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-lg">課程附件</span>
              <span className="ml-2 text-sm text-gray-500">({attachments.length} 個檔案)</span>
            </div>
          </h4>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 rounded-full border border-red-200"></div>
              <span>PDF</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 rounded-full border border-blue-200"></div>
              <span>Word</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-100 rounded-full border border-purple-200"></div>
              <span>圖片</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-100 rounded-full border border-yellow-200"></div>
              <span>音檔</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attachments.map((file, index) => {
            console.log(`📄 附件 ${index + 1}:`, file)
            return (
              <AttachmentCard key={index} file={file} />
            )
          })}
        </div>
        
        {/* 附件使用說明 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">💡 使用說明</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 點擊下載按鈕即可取得檔案</li>
            <li>• 部分檔案支援直接預覽或播放</li>
            <li>• 建議下載到本機保存以供離線使用</li>
          </ul>
        </div>
      </div>
    )
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
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入課程中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lessons.length && !loading) {
    // 顯示無課程內容頁面，移除自動重導向避免閃爍

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onSignOut={handleSignOut} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
              <div className="text-6xl mb-4">📚</div>
              <h1 className="text-xl font-bold text-gray-900 mb-4">課程內容準備中</h1>
              <p className="text-gray-600 mb-6">
                此課程目前尚無學習單元。請點擊下方按鈕返回課程詳細頁面。
              </p>
              <div className="space-y-2">
                <Link 
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  立即前往課程頁面
                </Link>
                <Link 
                  href="/courses" 
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  返回課程列表
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onSignOut={handleSignOut} />
      <div className="flex">
        {/* 側邊欄 - 響應式寬度 */}
        <div className={`${sidebarOpen ? 'w-80 xl:w-96' : 'w-16'} transition-all duration-300 bg-white shadow-lg flex-shrink-0`}>
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
                        {lesson.attachments && lesson.attachments.length > 0 && (
                          <div className="flex items-center mt-1">
                            <Paperclip className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">{lesson.attachments.length} 個附件</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 主要內容區域 - 響應式布局 */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentLesson && (
            <>
              {/* 內容頭部 */}
              <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 truncate">
                      {currentLesson.title}
                    </h1>
                    <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        {currentLesson.lesson_type === 'video' ? (
                          <PlayCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <FileText className="w-4 h-4 mr-1" />
                        )}
                        {currentLesson.lesson_type === 'video' ? '影片課程' : '文字課程'}
                      </span>
                      <span className="flex items-center">
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
                      {currentLesson.attachments && currentLesson.attachments.length > 0 && (
                        <span className="flex items-center">
                          <Paperclip className="w-4 h-4 mr-1" />
                          {currentLesson.attachments.length} 個附件
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hidden sm:block">
                      <Bookmark className="w-5 h-5" />
                    </button>
                    {!isLessonCompleted(currentLesson.id) && (
                      <button
                        onClick={() => markLessonCompleted(currentLesson.id)}
                        className="px-3 py-2 lg:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm lg:text-base"
                      >
                        標記完成
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 課程內容 - 響應式容器 */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <div className="max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto">
                  {currentLesson.lesson_type === 'video' ? (
                    <div className="space-y-6">
                      {/* 影片播放器 - 恢復原始尺寸 */}
                      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                        <VideoPlayer
                          lesson={currentLesson}
                          userId={user.id}
                          onProgressUpdate={handleProgressUpdate}
                          onComplete={handleLessonComplete}
                          className="w-full aspect-video"
                        />
                      </div>
                      
                      {/* 課程內容區域 */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                        {/* 單元描述 */}
                        {currentLesson.description && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                              單元描述
                            </h3>
                            <div className="prose prose-gray max-w-none">
                              <p className="text-gray-700 leading-relaxed">{currentLesson.description}</p>
                            </div>
                          </div>
                        )}

                        {/* 單元內容 */}
                        {currentLesson.content && (
                          <div className={currentLesson.description ? 'pt-6 border-t border-gray-200' : ''}>
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-green-600" />
                              單元內容
                            </h3>
                            <div className="prose prose-lg max-w-none">
                              {renderTextContent(currentLesson.content)}
                            </div>
                          </div>
                        )}

                        {/* 🎨 美化的附件列表 */}
                        {renderAttachments(currentLesson.attachments || [])}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-8">
                      {/* 單元描述 */}
                      {currentLesson.description && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                            單元描述
                          </h3>
                          <div className="prose prose-gray max-w-none">
                            <p className="text-gray-700 leading-relaxed">{currentLesson.description}</p>
                          </div>
                        </div>
                      )}

                      {/* 單元內容 */}
                      <div className={currentLesson.description ? 'pt-8 border-t border-gray-200' : ''}>
                        {currentLesson.content && (
                          <>
                            <h3 className="text-lg font-semibold mb-6 flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-green-600" />
                              單元內容
                            </h3>
                            <div className="prose prose-lg max-w-none">
                              {currentLesson.content ? renderTextContent(currentLesson.content) : (
                                <p className="text-gray-500">沒有課程內容</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* 🎨 美化的附件列表 */}
                      {renderAttachments(currentLesson.attachments || [])}
                    </div>
                  )}
                </div>
              </div>

              {/* 底部導航 - 響應式 */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex justify-between items-center max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto">
                  <button
                    onClick={() => {
                      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)
                      if (currentIndex > 0) {
                        switchToLesson(lessons[currentIndex - 1])
                      }
                    }}
                    disabled={lessons.findIndex(l => l.id === currentLesson.id) === 0}
                    className="flex items-center px-3 py-2 lg:px-4 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 transition-colors text-sm lg:text-base"
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
                    className="flex items-center px-3 py-2 lg:px-4 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 transition-colors text-sm lg:text-base"
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