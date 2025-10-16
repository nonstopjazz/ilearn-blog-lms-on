import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// POST - 更新觀看進度
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    const body = await request.json()

    // 接受兩種欄位名稱格式（舊的和新的）
    const {
      user_id,
      lesson_id,
      course_id,
      watched_duration,     // 新的資料庫欄位名稱
      current_time,         // 舊的前端傳來的名稱（向下相容）
      progress_percent,     // 新的資料庫欄位名稱
      progress_percentage,  // 舊的前端傳來的名稱（向下相容）
      completed
    } = body

    // 使用新欄位名稱，如果沒有則回退到舊名稱
    const videoPosition = watched_duration ?? current_time
    const progressValue = progress_percent ?? progress_percentage

    if (!user_id || !lesson_id || !course_id || videoPosition === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID, lesson ID, course ID, and video position are required'
        },
        { status: 400 }
      )
    }

    console.log('📹 更新影片進度:', {
      user_id,
      lesson_id,
      course_id,
      watched_duration: videoPosition,
      progress_percent: progressValue,
      completed
    })

    // 先查詢是否已存在記錄
    const { data: existing } = await supabase
      .from('user_lesson_progress')
      .select('id')
      .eq('user_id', user_id)
      .eq('lesson_id', lesson_id)
      .single()

    let data, error

    if (existing) {
      // 更新現有記錄 - 使用實際的數據庫欄位名稱
      const result = await supabase
        .from('user_lesson_progress')
        .update({
          course_id,
          watched_duration: videoPosition,
          progress_percent: progressValue || 0,
          completed: completed || false,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('user_id', user_id)
        .eq('lesson_id', lesson_id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      // 插入新記錄 - 使用實際的數據庫欄位名稱
      const result = await supabase
        .from('user_lesson_progress')
        .insert({
          user_id,
          lesson_id,
          course_id,
          watched_duration: videoPosition,
          progress_percent: progressValue || 0,
          completed: completed || false,
          completed_at: completed ? new Date().toISOString() : null
        })
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('❌ 更新進度失敗:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update progress: ' + error.message
        },
        { status: 500 }
      )
    }

    console.log('✅ 進度更新成功:', data)

    return NextResponse.json({
      success: true,
      progress: data,
      message: 'Progress updated successfully'
    })

  } catch (error: any) {
    console.error('💥 Video progress API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update progress: ' + error.message
      },
      { status: 500 }
    )
  }
}

// GET - 獲取用戶的觀看進度
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const lessonId = searchParams.get('lesson_id')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (lessonId) {
      // 獲取特定單元的進度
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ 獲取進度失敗:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        progress: data
      })
    } else {
      // 獲取用戶所有的觀看進度
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('❌ 獲取進度列表失敗:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        progress_list: data
      })
    }

  } catch (error: any) {
    console.error('💥 Video progress API GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch progress: ' + error.message
      },
      { status: 500 }
    )
  }
}
