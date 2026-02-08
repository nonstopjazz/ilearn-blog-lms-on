// src/hooks/useCourseAccess.js
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const useCourseAccess = (courseId) => {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [accessInfo, setAccessInfo] = useState(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 檢查用戶登入狀態
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          throw new Error('登入驗證失敗')
        }

        setUser(user)

        if (!user) {
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        if (!courseId) {
          setError('課程 ID 不存在')
          setIsLoading(false)
          return
        }

        // 檢查用戶課程權限
        const { data: accessData, error: accessError } = await supabase
          .from('user_course_access')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single()

        if (accessError && accessError.code !== 'PGRST116') {
          // PGRST116 是 "no rows returned" 錯誤，其他錯誤才需要處理
          throw new Error('權限檢查失敗')
        }

        if (!accessData) {
          setHasAccess(false)
          setAccessInfo(null)
        } else {
          // 檢查權限是否過期
          const isExpired = accessData.expires_at && 
                           new Date(accessData.expires_at) < new Date()

          if (isExpired) {
            setHasAccess(false)
            setError('您的課程權限已過期')
          } else {
            setHasAccess(true)
            setAccessInfo(accessData)
          }
        }

      } catch (err) {
        console.error('課程權限檢查錯誤:', err)
        setError(err.message || '權限檢查失敗')
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [courseId, supabase])

  const requestAccess = async () => {
    try {
      if (!user || !courseId) {
        throw new Error('請先登入')
      }

      // 檢查是否已經有申請記錄
      const { data: existingRequest } = await supabase
        .from('course_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          throw new Error('您已經申請過此課程，請等待管理員審核')
        } else if (existingRequest.status === 'rejected') {
          throw new Error('您的申請已被拒絕，請聯繫管理員')
        }
      }

      // 獲取課程資訊
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single()

      if (courseError) {
        throw new Error('課程不存在')
      }

      // 建立課程申請
      const { error: requestError } = await supabase
        .from('course_requests')
        .insert({
          user_id: user.id,
          course_id: courseId,
          course_title: courseData.title,
          user_info: {
            email: user.email,
            name: user.user_metadata?.name || user.email
          },
          status: 'pending'
        })

      if (requestError) {
        throw new Error('申請提交失敗')
      }

      return { success: true, message: '課程權限申請已提交，請等待管理員審核' }

    } catch (err) {
      console.error('申請課程權限錯誤:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    hasAccess,
    isLoading,
    error,
    user,
    accessInfo,
    requestAccess
  }
}