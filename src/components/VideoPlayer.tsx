// src/components/VideoPlayer.tsx - 簡化版本測試
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Loader, AlertCircle, ExternalLink } from 'lucide-react'

interface VideoProgress {
  user_id: string
  lesson_id: string
  current_time: number
  progress_percentage: number
  completed: boolean
}

interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string
  content?: string
  lesson_type: 'video' | 'text'
  video_url?: string
  video_duration?: number
  attachments?: any[]
  user_progress?: {
    progress_percentage?: number
    completed?: boolean
    current_time?: number
  }
}

interface VideoPlayerProps {
  lesson: Lesson
  userId: string
  onProgressUpdate: (progress: VideoProgress) => void
  onComplete: () => void
  className?: string
}

export default function VideoPlayer({ 
  lesson, 
  userId, 
  onProgressUpdate, 
  onComplete, 
  className = '' 
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoSource, setVideoSource] = useState<'youtube' | 'bunny' | 'unknown'>('unknown')
  const [hlsFailed, setHlsFailed] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hlsInstance = useRef<any>(null)
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null)
  const hasRestoredProgress = useRef(false)

  // 🔧 添加 HLS.js 和 YouTube 類型聲明
  declare global {
    interface Window {
      Hls: any
      YT: any
      onYouTubeIframeAPIReady: () => void
    }
  }

  // YouTube Player 實例
  const youtubePlayerRef = useRef<any>(null)

  // 🔧 檢測影片來源
  const detectVideoSource = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube'
    } else if (url.includes('b-cdn.net') || url.includes('bunnycdn.com')) {
      return 'bunny'
    }
    return 'unknown'
  }

  // 🎯 儲存影片進度
  const saveProgress = (currentTime: number) => {
    if (!lesson.video_duration || lesson.video_duration === 0) return

    const progressPercentage = Math.round((currentTime / lesson.video_duration) * 100)
    const isCompleted = progressPercentage >= 80

    console.log('💾 儲存影片進度:', {
      currentTime,
      duration: lesson.video_duration,
      percentage: progressPercentage
    })

    onProgressUpdate({
      user_id: userId,
      lesson_id: lesson.id,
      course_id: lesson.course_id,  // 加入 course_id
      watched_duration: currentTime,  // 使用資料庫實際欄位名稱
      progress_percent: progressPercentage,  // 使用資料庫實際欄位名稱
      completed: isCompleted
    } as any)

    if (isCompleted && !lesson.user_progress?.completed) {
      onComplete()
    }
  }

  // 🔧 提取 YouTube ID
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  // 🔧 設定 YouTube 播放器（使用 YouTube iframe API 來追蹤進度）
  const setupYouTubePlayer = (youtubeId: string) => {
    console.log('📺 設定 YouTube 播放器, ID:', youtubeId)

    // 載入 YouTube iframe API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        initYouTubePlayer(youtubeId)
      }
    } else {
      initYouTubePlayer(youtubeId)
    }
  }

  // 初始化 YouTube Player
  const initYouTubePlayer = (youtubeId: string) => {
    if (!iframeRef.current) return

    const startTime = lesson.user_progress?.watched_duration || 0

    console.log('🎬 初始化 YouTube Player, 起始時間:', startTime)

    youtubePlayerRef.current = new window.YT.Player(iframeRef.current, {
      videoId: youtubeId,
      playerVars: {
        autoplay: 0,
        start: Math.floor(startTime),
        enablejsapi: 1,
        origin: window.location.origin,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event: any) => {
          console.log('✅ YouTube 播放器準備完成')
          setLoading(false)
          setError(null)
          hasRestoredProgress.current = true

          // 設定定時器追蹤播放進度
          progressSaveInterval.current = setInterval(() => {
            if (youtubePlayerRef.current && youtubePlayerRef.current.getPlayerState() === 1) { // 1 = playing
              const currentTime = Math.floor(youtubePlayerRef.current.getCurrentTime())
              if (currentTime > 0) {
                saveProgress(currentTime)
              }
            }
          }, 5000) // 每 5 秒儲存一次
        },
        onStateChange: (event: any) => {
          // 0 = ended, 2 = paused
          if (event.data === 0 || event.data === 2) {
            const currentTime = Math.floor(youtubePlayerRef.current.getCurrentTime())
            if (currentTime > 0) {
              console.log('⏸️ YouTube 影片暫停/結束，儲存進度')
              saveProgress(currentTime)
            }
          }
        },
        onError: (event: any) => {
          console.error('❌ YouTube 播放器錯誤:', event.data)
          setError('YouTube 影片載入失敗')
          setLoading(false)
        }
      }
    })
  }

  // 🔧 設定 Bunny.net 播放器（添加 HLS.js 支援）
  const setupBunnyPlayer = () => {
    console.log('🐰 設定 Bunny.net 播放器（HLS.js 版本）')
    
    // 先檢查 video 元素是否存在
    if (!videoRef.current) {
      console.error('❌ Video element not found')
      setError('影片元素未找到')
      setLoading(false)
      return
    }

    const video = videoRef.current
    const streamURL = lesson.video_url!
    
    console.log('🔗 Bunny HLS Stream URL:', streamURL)
    
    // 🔧 檢查是否支援原生 HLS (主要是 Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('✅ 使用原生 HLS 支援 (Safari)')
      video.src = streamURL
      
      video.onloadedmetadata = () => {
        console.log('✅ 原生 HLS 影片載入完成')
        setLoading(false)
        setError(null)

        // 恢復之前的播放位置
        if (!hasRestoredProgress.current && lesson.user_progress?.watched_duration) {
          const resumeTime = lesson.user_progress.watched_duration
          console.log('🔄 恢復播放位置:', resumeTime, '秒')
          video.currentTime = resumeTime
          hasRestoredProgress.current = true
        }
      }
      
      video.onerror = (e) => {
        console.error('❌ 原生 HLS 載入失敗:', e)
        setError('Bunny.net HLS 影片載入失敗')
        setLoading(false)
      }
    } else {
      // 🔧 其他瀏覽器使用 HLS.js
      console.log('📦 需要 HLS.js 來播放，開始載入...')
      
      // 動態載入 HLS.js
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
      script.onload = () => {
        console.log('✅ HLS.js 載入成功')
        
        // 檢查 HLS.js 支援
        if (window.Hls && window.Hls.isSupported()) {
          console.log('✅ HLS.js 支援確認')
          
          // 🔧 優化 HLS.js 配置以避免 bufferAppendError
          const hls = new window.Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false, // 關閉低延遲模式
            backBufferLength: 30, // 減少後緩衝長度
            maxBufferLength: 30, // 設定最大緩衝長度
            maxMaxBufferLength: 600, // 設定最大緩衝上限
            maxBufferSize: 60 * 1000 * 1000, // 60MB 緩衝大小
            maxBufferHole: 0.5, // 允許的緩衝空洞
            // 錯誤恢復設定
            xhrSetup: function(xhr: XMLHttpRequest, url: string) {
              xhr.timeout = 30000; // 30秒超時
            },
            manifestLoadingTimeOut: 30000,
            manifestLoadingMaxRetry: 3,
            levelLoadingTimeOut: 30000,
            levelLoadingMaxRetry: 3,
            fragLoadingTimeOut: 30000,
            fragLoadingMaxRetry: 3
          })
          
          // 儲存 HLS 實例
          hlsInstance.current = hls
          
          hls.loadSource(streamURL)
          hls.attachMedia(video)
          
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            console.log('✅ HLS manifest 解析完成')
            setLoading(false)
            setError(null)

            // 恢復之前的播放位置
            if (!hasRestoredProgress.current && lesson.user_progress?.watched_duration) {
              const resumeTime = lesson.user_progress.watched_duration
              console.log('🔄 恢復播放位置:', resumeTime, '秒')
              video.currentTime = resumeTime
              hasRestoredProgress.current = true
            }
          })
          
          // 🔧 增強錯誤處理和恢復機制
          hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
            console.error('❌ HLS 播放錯誤:', data)
            
            // 處理 bufferAppendError
            if (data.details === 'bufferAppendError') {
              console.warn('⚠️ Buffer append error detected, attempting recovery...')
              
              // 嘗試恢復策略
              if (!data.fatal) {
                // 非致命錯誤，嘗試跳過有問題的片段
                console.log('🔧 嘗試跳過有問題的片段...')
                return
              }
              
              // 致命錯誤，嘗試重新載入
              console.log('🔧 嘗試重新載入影片流...')
              setTimeout(() => {
                hls.recoverMediaError()
              }, 1000)
              return
            }
            
            if (data.fatal) {
              switch (data.type) {
                case window.Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('❌ HLS 網路錯誤，嘗試重新載入...')
                  // 嘗試恢復網路錯誤
                  hls.startLoad()
                  break
                  
                case window.Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('❌ HLS 媒體錯誤，嘗試恢復...')
                  // 嘗試恢復媒體錯誤
                  hls.recoverMediaError()
                  break
                  
                default:
                  console.error('❌ HLS 其他致命錯誤')
                  setError('影片播放遇到問題，請重新整理頁面')
                  setLoading(false)
                  break
              }
            }
          })
          
          // 🔧 添加媒體錯誤恢復嘗試計數
          let mediaErrorRecoveryAttempts = 0
          const maxRecoveryAttempts = 3
          
          hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
            if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              if (mediaErrorRecoveryAttempts < maxRecoveryAttempts) {
                mediaErrorRecoveryAttempts++
                console.log(`🔧 媒體錯誤恢復嘗試 ${mediaErrorRecoveryAttempts}/${maxRecoveryAttempts}`)
                setTimeout(() => {
                  hls.recoverMediaError()
                }, 1000 * mediaErrorRecoveryAttempts)
              } else {
                console.error('❌ 媒體錯誤恢復失敗，已達最大嘗試次數')
                console.log('🔧 嘗試備用播放方案...')
                
                // 銷毀 HLS 實例
                if (hlsInstance.current) {
                  hlsInstance.current.destroy()
                  hlsInstance.current = null
                }
                
                // 嘗試直接播放 m3u8
                if (video && streamURL) {
                  console.log('🔧 嘗試直接設定 video.src 播放 m3u8...')
                  video.src = streamURL
                  video.load()
                  
                  video.addEventListener('loadeddata', () => {
                    console.log('✅ 備用方案：直接播放成功')
                    setLoading(false)
                    setError(null)
                  })
                  
                  video.addEventListener('error', (e) => {
                    console.error('❌ 備用方案也失敗:', e)
                    setError('影片無法播放，可能是格式不相容或網路問題')
                    setLoading(false)
                    setHlsFailed(true)
                  })
                }
              }
            }
          })
          
          // 清理函數
          video.onbeforeunload = () => {
            hls.destroy()
          }
          
        } else {
          console.error('❌ HLS.js 不支援此瀏覽器')
          setError('瀏覽器不支援 HLS 播放')
          setLoading(false)
        }
      }
      
      script.onerror = () => {
        console.error('❌ HLS.js 載入失敗')
        setError('HLS.js 載入失敗，無法播放 Bunny.net 影片')
        setLoading(false)
      }
      
      document.head.appendChild(script)
    }
  }

  // 🔧 初始化播放器
  useEffect(() => {
    console.log('🎬 VideoPlayer 初始化（簡化版）')
    console.log('📋 課程資料:', {
      id: lesson.id,
      title: lesson.title,
      lesson_type: lesson.lesson_type,
      video_url: lesson.video_url,
      video_duration: lesson.video_duration
    })

    // 重置狀態
    setLoading(true)
    setError(null)
    setVideoSource('unknown')

    // 檢查是否為影片課程
    if (lesson.lesson_type !== 'video') {
      setError('此課程不是影片課程')
      setLoading(false)
      return
    }

    // 檢查是否有影片 URL
    if (!lesson.video_url) {
      setError('此課程沒有影片 URL')
      setLoading(false)
      return
    }

    // 檢測影片來源
    const detectedSource = detectVideoSource(lesson.video_url)
    setVideoSource(detectedSource)
    console.log('🔍 檢測到的影片來源:', detectedSource)

    // 根據來源設定播放器
    switch (detectedSource) {
      case 'youtube':
        const youtubeId = extractYouTubeId(lesson.video_url)
        if (youtubeId) {
          setupYouTubePlayer(youtubeId)
        } else {
          setError('無法解析 YouTube 影片 ID')
          setLoading(false)
        }
        break

      case 'bunny':
        // 延遲一點再設定，確保 DOM 渲染完成
        setTimeout(() => {
          setupBunnyPlayer()
        }, 100)
        break

      default:
        setError(`不支援的影片來源: ${lesson.video_url}`)
        setLoading(false)
    }

  }, [lesson.id, lesson.video_url])

  // 🔧 新增：Page Visibility API - 防止切換分頁時重新載入
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📴 頁面切換到背景（隱藏）')
        // 頁面隱藏時儲存當前進度
        if (videoRef.current && videoSource === 'bunny') {
          const currentTime = Math.floor(videoRef.current.currentTime)
          if (currentTime > 0) {
            console.log('💾 背景儲存進度:', currentTime)
            saveProgress(currentTime)
          }
        } else if (youtubePlayerRef.current && videoSource === 'youtube') {
          try {
            const currentTime = Math.floor(youtubePlayerRef.current.getCurrentTime())
            if (currentTime > 0) {
              console.log('💾 背景儲存 YouTube 進度:', currentTime)
              saveProgress(currentTime)
            }
          } catch (e) {
            console.warn('無法獲取 YouTube 播放時間:', e)
          }
        }
      } else {
        console.log('👀 頁面回到前景（可見）')
        // 頁面重新可見時不需要做任何事，讓影片繼續播放
      }
    }

    // 監聽頁面可見性變化
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [videoSource, lesson.id, lesson.video_duration, userId])

  // 🎯 設定影片進度追蹤（僅適用於 Bunny.net 原生 video 元素）
  useEffect(() => {
    if (videoSource !== 'bunny' || !videoRef.current) return

    const video = videoRef.current

    // 監聽播放進度更新（每秒觸發多次）
    const handleTimeUpdate = () => {
      const currentTime = Math.floor(video.currentTime)

      // 每 5 秒自動儲存一次進度
      if (currentTime % 5 === 0 && currentTime > 0) {
        saveProgress(currentTime)
      }
    }

    // 監聽播放暫停時儲存進度
    const handlePause = () => {
      const currentTime = Math.floor(video.currentTime)
      if (currentTime > 0) {
        console.log('⏸️ 影片暫停，儲存進度')
        saveProgress(currentTime)
      }
    }

    // 監聽影片結束
    const handleEnded = () => {
      console.log('✅ 影片播放結束')
      if (lesson.video_duration) {
        saveProgress(lesson.video_duration)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    // 頁面卸載前儲存進度
    const handleBeforeUnload = () => {
      const currentTime = Math.floor(video.currentTime)
      if (currentTime > 0) {
        console.log('🚪 頁面卸載，儲存進度')
        saveProgress(currentTime)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [videoSource, lesson.id, lesson.video_duration, userId])

  // 🔧 清理資源（HLS、YouTube Player、Progress Interval）
  useEffect(() => {
    return () => {
      // 清理 HLS 實例
      if (hlsInstance.current) {
        console.log('🧹 清理 HLS 實例')
        hlsInstance.current.destroy()
        hlsInstance.current = null
      }

      // 清理 YouTube Player
      if (youtubePlayerRef.current) {
        console.log('🧹 清理 YouTube Player')
        try {
          youtubePlayerRef.current.destroy()
        } catch (e) {
          console.warn('YouTube Player 清理警告:', e)
        }
        youtubePlayerRef.current = null
      }

      // 清理進度儲存 interval
      if (progressSaveInterval.current) {
        console.log('🧹 清理進度儲存計時器')
        clearInterval(progressSaveInterval.current)
        progressSaveInterval.current = null
      }

      // 重置進度恢復標記
      hasRestoredProgress.current = false
    }
  }, [lesson.id])

  // 錯誤狀態
  if (error) {
    return (
      <div className={`${className} bg-gray-900 flex items-center justify-center min-h-[300px]`}>
        <div className="text-center text-white p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">播放錯誤</h3>
          <p className="text-sm opacity-90 mb-4">{error}</p>
          <div className="text-xs bg-gray-800 p-3 rounded mb-4 text-left">
            <p><strong>課程類型:</strong> {lesson.lesson_type}</p>
            <p><strong>檢測來源:</strong> {videoSource}</p>
            <p><strong>課程標題:</strong> {lesson.title}</p>
            {lesson.video_url && (
              <div className="mt-2 p-2 bg-gray-700 rounded text-xs break-all">
                <strong>完整 URL:</strong> {lesson.video_url}
              </div>
            )}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
          >
            重新載入頁面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative bg-black aspect-video`}>
      {/* 載入指示器 */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-sm">載入影片中...</p>
            <p className="text-xs opacity-60 mt-1">
              {videoSource === 'youtube' && '📺 YouTube'}
              {videoSource === 'bunny' && '🐰 Bunny.net'}
            </p>
            <p className="text-xs opacity-40 mt-1">{lesson.title}</p>
          </div>
        </div>
      )}

      {/* 影片播放器 */}
      {videoSource === 'bunny' ? (
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          playsInline
          preload="metadata"
        />
      ) : videoSource === 'youtube' ? (
        <div
          ref={iframeRef as any}
          className="w-full h-full"
        />
      ) : (
        <iframe
          ref={iframeRef}
          title={lesson.title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}

      {/* 影片來源標識 */}
      <div className="absolute top-4 right-4 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
        {videoSource === 'youtube' && '📺 YouTube'}
        {videoSource === 'bunny' && '🐰 Bunny.net HLS'}
        {videoSource === 'unknown' && '🎬 Unknown'}
      </div>

      {/* 影片時長 */}
      {lesson.video_duration && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
          {Math.floor(lesson.video_duration / 60)} 分鐘
        </div>
      )}
    </div>
  )
}