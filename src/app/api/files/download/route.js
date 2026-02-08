// src/app/api/files/download/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // 使用你現有的 Supabase 客戶端
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url)
    
    // 獲取參數
    const fileUrl = searchParams.get('url')
    const courseId = searchParams.get('courseId')
    const lessonId = searchParams.get('lessonId')
    const fileName = searchParams.get('fileName') || 'download'

    // 驗證必要參數
    if (!fileUrl || !courseId || !lessonId) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      )
    }

    // 1. 檢查用戶登入狀態
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '請先登入才能下載檔案' },
        { status: 401 }
      )
    }

    // 2. 檢查用戶是否有課程存取權限
    const { data: accessData, error: accessError } = await supabase
      .from('user_course_access')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (accessError || !accessData) {
      return NextResponse.json(
        { error: '您沒有此課程的存取權限，請先申請課程權限' },
        { status: 403 }
      )
    }

    // 3. 檢查權限是否過期
    if (accessData.expires_at && new Date(accessData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '您的課程權限已過期' },
        { status: 403 }
      )
    }

    // 4. 驗證檔案是否屬於該課程的 lesson
    const { data: lessonData, error: lessonError } = await supabase
      .from('course_lessons')
      .select('attachments')
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .single()

    if (lessonError || !lessonData) {
      return NextResponse.json(
        { error: '找不到指定的課程單元' },
        { status: 404 }
      )
    }

    // 5. 檢查檔案 URL 是否在 lesson 的 attachments 中
    const attachments = lessonData.attachments || []
    let fileExists = false

    if (Array.isArray(attachments)) {
      fileExists = attachments.some(attachment => {
        if (typeof attachment === 'string') {
          return attachment === fileUrl
        } else if (typeof attachment === 'object' && attachment.url) {
          return attachment.url === fileUrl
        }
        return false
      })
    }

    if (!fileExists) {
      return NextResponse.json(
        { error: '檔案不存在或已被移除' },
        { status: 404 }
      )
    }

    // 6. 記錄下載行為
    try {
      const { error: logError } = await supabase
        .from('file_download_logs')
        .insert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          file_url: fileUrl,
          file_name: fileName,
          ip_address: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })

      if (logError) {
        console.warn('下載記錄失敗:', logError)
        // 不阻止下載，只記錄警告
      }
    } catch (logErr) {
      console.warn('下載記錄錯誤:', logErr)
      // 繼續下載流程
    }

    // 7. 處理不同類型的檔案 URL
    if (fileUrl.includes('drive.google.com')) {
      // Google Drive 檔案 - 重定向到下載連結
      let downloadUrl = fileUrl
      
      // 轉換 Google Drive 分享連結為直接下載連結
      if (fileUrl.includes('/file/d/')) {
        const fileId = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]
        if (fileId) {
          downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
        }
      }
      
      return NextResponse.redirect(downloadUrl)
    } 
    else if (fileUrl.includes('dropbox.com')) {
      // Dropbox 檔案 - 確保是下載連結
      const downloadUrl = fileUrl.replace('?dl=0', '?dl=1')
      return NextResponse.redirect(downloadUrl)
    }
    else {
      // 其他檔案 - 直接重定向
      return NextResponse.redirect(fileUrl)
    }

  } catch (error) {
    console.error('檔案下載錯誤:', error)
    return NextResponse.json(
      { error: '檔案下載失敗，請稍後再試' },
      { status: 500 }
    )
  }
}