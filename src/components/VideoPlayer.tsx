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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 🔧 添加 HLS.js 類型聲明
  declare global {
    interface Window {
      Hls: any
    }
  }

  // 🔧 檢測影片來源
  const detectVideoSource = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube'
    } else if (url.includes('b-cdn.net') || url.includes('bunnycdn.com')) {
      return 'bunny'
    }
    return 'unknown'
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

  // 🔧 設定 YouTube 播放器
  const setupYouTubePlayer = (youtubeId: string) => {
    console.log('📺 設定 YouTube 播放器, ID:', youtubeId)
    
    const embedURL = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1&start=0`
    
    if (iframeRef.current) {
      iframeRef.current.src = embedURL
      iframeRef.current.onload = () => {
        console.log('✅ YouTube 播放器載入成功')
        setLoading(false)
        setError(null)
      }
      iframeRef.current.onerror = () => {
        console.error('❌ YouTube 播放器載入失敗')
        setError('YouTube 影片載入失敗')
        setLoading(false)
      }
    }
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
          
          const hls = new window.Hls({
            debug: false, // 關閉除錯模式
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          })
          
          hls.loadSource(streamURL)
          hls.attachMedia(video)
          
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            console.log('✅ HLS manifest 解析完成')
            setLoading(false)
            setError(null)
          })
          
          hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
            console.error('❌ HLS 播放錯誤:', data)
            
            if (data.fatal) {
              switch (data.type) {
                case window.Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('❌ HLS 網路錯誤')
                  setError('網路錯誤，無法載入 Bunny.net 影片')
                  break
                case window.Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('❌ HLS 媒體錯誤')
                  setError('媒體錯誤，影片格式不支援')
                  break
                default:
                  console.error('❌ HLS 其他錯誤')
                  setError('HLS 播放錯誤')
                  break
              }
              setLoading(false)
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