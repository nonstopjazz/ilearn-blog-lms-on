// src/app/api/test/bunny/route.ts - 創建這個新檔案

import { NextRequest, NextResponse } from 'next/server'
import { bunnyAPI } from '@/lib/bunny-api'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Bunny.net 連接測試 ===')
    
    // 檢查環境變數
    const apiKey = process.env.BUNNY_API_KEY
    const libraryId = process.env.BUNNY_LIBRARY_ID
    const cdnHostname = process.env.BUNNY_CDN_HOSTNAME
    const testVideoId = process.env.BUNNY_TEST_VIDEO_ID

    console.log('環境變數檢查:')
    console.log('- API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : '未設定')
    console.log('- Library ID:', libraryId || '未設定')
    console.log('- CDN Hostname:', cdnHostname || '未設定')
    console.log('- Test Video ID:', testVideoId || '未設定')

    if (!apiKey || !libraryId || !cdnHostname || !testVideoId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的環境變數',
        missing: {
          BUNNY_API_KEY: !apiKey,
          BUNNY_LIBRARY_ID: !libraryId,
          BUNNY_CDN_HOSTNAME: !cdnHostname,
          BUNNY_TEST_VIDEO_ID: !testVideoId
        }
      }, { status: 400 })
    }

    // 測試 API 連接
    console.log('測試 API 連接...')
    const connectionTest = await bunnyAPI.testConnection()
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'Bunny.net API 連接失敗',
        details: 'API Key 或 Library ID 可能不正確'
      }, { status: 500 })
    }

    // 測試獲取影片資訊
    console.log('測試影片資訊獲取...')
    let videoInfo = null
    try {
      videoInfo = await bunnyAPI.getVideo(testVideoId)
      console.log('影片資訊獲取成功:', videoInfo.title || '無標題')
    } catch (error: unknown) {
      console.error('影片資訊獲取失敗:', error)
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      return NextResponse.json({
        success: false,
        error: '無法獲取測試影片資訊',
        details: errorMessage,
        video_id: testVideoId
      }, { status: 500 })
    }

    // 生成各種 URL
    const embedURL = bunnyAPI.getEmbedURL(testVideoId)
    const directURL = bunnyAPI.getDirectPlayURL(testVideoId)
    const thumbnailURL = bunnyAPI.getThumbnailURL(testVideoId)

    console.log('所有測試通過！')

    return NextResponse.json({
      success: true,
      message: 'Bunny.net 整合測試通過！',
      test_results: {
        connection: '✅ 成功',
        video_access: '✅ 成功',
        api_response: '✅ 正常'
      },
      video_info: {
        id: videoInfo.guid,
        title: videoInfo.title,
        status: videoInfo.status,
        duration: videoInfo.length,
        width: videoInfo.width,
        height: videoInfo.height,
        created: videoInfo.dateUploaded
      },
      generated_urls: {
        embed_url: embedURL,
        direct_url: directURL,
        thumbnail_url: thumbnailURL
      },
      environment: {
        library_id: libraryId,
        cdn_hostname: cdnHostname,
        api_endpoint: `https://video.bunnycdn.com/library/${libraryId}`
      }
    })

  } catch (error: unknown) {
    console.error('Bunny.net 測試失敗:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({
      success: false,
      error: 'Bunny.net 測試失敗',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 })
  }
}