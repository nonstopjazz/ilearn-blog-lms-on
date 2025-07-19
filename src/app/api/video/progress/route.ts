import { NextRequest, NextResponse } from 'next/server'
import { videoData } from '@/lib/video-data'

// GET - 獲取用戶的觀看進度
export async function GET(request: NextRequest) {
  try {
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
      const progress = videoData.getUserProgress(userId, lessonId)
      
      return NextResponse.json({
        success: true,
        progress: progress
      })
    } else {
      // 獲取用戶所有的觀看進度
      const allProgress = videoData.getAllUserProgress(userId)
      
      return NextResponse.json({
        success: true,
        progress_list: allProgress
      })
    }

  } catch (error) {
    console.error('Video progress API GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch progress'
      },
      { status: 500 }
    )
  }
}

// POST - 更新觀看進度
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, lesson_id, current_time, completed } = body

    if (!user_id || !lesson_id || current_time === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID, lesson ID, and current time are required' 
        },
        { status: 400 }
      )
    }

    // 更新進度
    const updatedProgress = videoData.updateProgress(user_id, lesson_id, {
      current_time: current_time,
      completed: completed
    })

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      message: 'Progress updated successfully'
    })

  } catch (error) {
    console.error('Video progress API POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update progress'
      },
      { status: 500 }
    )
  }
}

// PUT - 批量更新進度（用於課程完成等）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, lesson_progresses } = body

    if (!user_id || !Array.isArray(lesson_progresses)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID and lesson progresses array are required' 
        },
        { status: 400 }
      )
    }

    const updatedProgresses = lesson_progresses.map(progressData => {
      return videoData.updateProgress(user_id, progressData.lesson_id, progressData)
    })

    return NextResponse.json({
      success: true,
      progresses: updatedProgresses,
      message: 'Progresses updated successfully'
    })

  } catch (error) {
    console.error('Video progress API PUT error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to batch update progress'
      },
      { status: 500 }
    )
  }
}