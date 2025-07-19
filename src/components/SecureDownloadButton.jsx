// src/components/SecureDownloadButton.jsx
import React, { useState } from 'react'
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const SecureDownloadButton = ({ 
  fileUrl, 
  fileName, 
  courseId, 
  lessonId, 
  fileType = 'file',
  className = '' 
}) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      setError('')

      // 檢查用戶登入狀態
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('請先登入才能下載檔案')
        return
      }

      // 建立安全下載 URL
      const downloadParams = new URLSearchParams({
        url: fileUrl,
        courseId: courseId,
        lessonId: lessonId,
        fileName: fileName
      })

      const secureDownloadUrl = `/api/files/download?${downloadParams.toString()}`

      console.log(`🔗 安全下載連結: ${secureDownloadUrl}`)

      // 開啟新視窗進行下載
      const downloadWindow = window.open(secureDownloadUrl, '_blank')
      
      if (!downloadWindow) {
        // 如果彈出視窗被阻擋，使用 fetch 檢查權限
        const response = await fetch(secureDownloadUrl)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '下載失敗')
        }
        
        // 手動重定向
        window.location.href = secureDownloadUrl
      }

    } catch (err) {
      console.error('下載錯誤:', err)
      setError(err.message || '下載失敗，請稍後再試')
    } finally {
      setIsDownloading(false)
    }
  }

  const getFileIcon = () => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />
      case 'word':
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'excel':
      case 'xls':
      case 'xlsx':
        return <FileText className="w-4 h-4 text-green-500" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
          text-white font-medium transition-colors
          ${className}
        `}
        title={`下載 ${fileName}`}
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          getFileIcon()
        )}
        <span>
          {isDownloading ? '下載中...' : `下載 ${fileName}`}
        </span>
      </button>
      
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default SecureDownloadButton