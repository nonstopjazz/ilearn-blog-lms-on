// src/app/api/debug/course/[courseId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { videoData } from '@/lib/video-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    
    console.log('=== 調試課程單元API ===')
    console.log('請求的 courseId:', courseId)
    console.log('courseId 類型:', typeof courseId)
    
    // 1. 檢查所有課程資料
    const allLessons = videoData.getAllLessons()
    console.log('所有單元總數:', allLessons.length)
    console.log('所有單元列表:', allLessons.map(l => ({ 
      id: l.id, 
      course_id: l.course_id, 
      title: l.title 
    })))
    
    // 2. 檢查特定課程的單元
    const courseLessons = videoData.getLessonsByCourse(courseId)
    console.log('通過函數獲取的單元數量:', courseLessons.length)
    console.log('通過函數獲取的單元:', courseLessons)
    
    // 3. 手動篩選對比
    const manualFilter = allLessons.filter(lesson => lesson.course_id === courseId)
    console.log('手動篩選的單元數量:', manualFilter.length)
    console.log('手動篩選的單元:', manualFilter)
    
    // 4. 檢查字串比較
    const courseIdMatches = allLessons.map(lesson => ({
      lesson_id: lesson.id,
      lesson_course_id: lesson.course_id,
      requested_course_id: courseId,
      strict_equal: lesson.course_id === courseId,
      loose_equal: lesson.course_id == courseId,
      type_lesson: typeof lesson.course_id,
      type_request: typeof courseId
    }))
    
    console.log('字串比較詳情:', courseIdMatches)
    
    // 5. 檢查是否有course_001的資料
    const course001Lessons = allLessons.filter(lesson => 
      lesson.course_id.includes('course_001') || 
      lesson.course_id === 'course_001'
    )
    console.log('包含course_001的單元:', course001Lessons)
    
    return NextResponse.json({
      success: true,
      debug_info: {
        requested_courseId: courseId,
        courseId_type: typeof courseId,
        all_lessons_count: allLessons.length,
        function_result_count: courseLessons.length,
        manual_filter_count: manualFilter.length,
        all_lessons: allLessons.map(l => ({ 
          id: l.id, 
          course_id: l.course_id, 
          title: l.title,
          course_id_type: typeof l.course_id
        })),
        function_result: courseLessons,
        manual_filter_result: manualFilter,
        string_comparisons: courseIdMatches,
        course_001_matches: course001Lessons
      }
    })
    
  } catch (error: unknown) {
    console.error('調試API錯誤:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack
    }, { status: 500 })
  }
}