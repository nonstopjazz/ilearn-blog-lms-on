
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 測試是否能正確載入 video-data
    const { videoData } = await import('@/lib/video-data')
    
    const allLessons = videoData.getAllLessons()
    const course001Lessons = videoData.getLessonsByCourse('course_001')
    
    return NextResponse.json({
      success: true,
      debug: {
        total_lessons: allLessons.length,
        course_001_lessons: course001Lessons.length,
        all_lessons: allLessons.map(l => ({ id: l.id, course_id: l.course_id, title: l.title })),
        course_001_details: course001Lessons.map(l => ({ id: l.id, title: l.title, type: l.lesson_type }))
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}