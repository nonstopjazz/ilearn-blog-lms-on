import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少 user_id 參數' },
        { status: 400 }
      );
    }

    // 查詢已放行的課程
    const { data: approvedCourses, error: coursesError } = await supabase
      .from('course_requests')
      .select('course_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (coursesError) {
      console.error('查詢課程請求失敗:', coursesError);
      return NextResponse.json(
        { success: false, error: '查詢課程失敗' },
        { status: 500 }
      );
    }

    if (!approvedCourses || approvedCourses.length === 0) {
      return NextResponse.json({
        success: true,
        courses: []
      });
    }

    const courseIds = approvedCourses.map(c => c.course_id);

    // 查詢課程資訊
    const { data: courses, error: courseInfoError } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail_url')
      .in('id', courseIds);

    if (courseInfoError) {
      console.error('查詢課程資訊失敗:', courseInfoError);
      return NextResponse.json(
        { success: false, error: '查詢課程資訊失敗' },
        { status: 500 }
      );
    }

    // 查詢每個課程的單元和進度
    const coursesWithProgress = await Promise.all(
      (courses || []).map(async (course) => {
        // 查詢課程單元
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('id, video_duration')
          .eq('course_id', course.id);

        if (lessonsError) {
          console.error(`查詢課程 ${course.id} 單元失敗:`, lessonsError);
          return {
            ...course,
            total_lessons: 0,
            completed_lessons: 0,
            total_watch_time: 0,
            last_study_time: null,
            progress_percentage: 0
          };
        }

        const lessonIds = (lessons || []).map(l => l.id);

        if (lessonIds.length === 0) {
          return {
            ...course,
            total_lessons: 0,
            completed_lessons: 0,
            total_watch_time: 0,
            last_study_time: null,
            progress_percentage: 0
          };
        }

        // 查詢用戶進度
        const { data: progress, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('completed, current_time, last_watched_at')
          .eq('user_id', userId)
          .in('lesson_id', lessonIds);

        if (progressError) {
          console.error(`查詢課程 ${course.id} 進度失敗:`, progressError);
        }

        const completedCount = (progress || []).filter(p => p.completed).length;
        const totalWatchTime = (progress || []).reduce((sum, p) => sum + (p.current_time || 0), 0);
        const lastStudyTime = (progress || [])
          .map(p => p.last_watched_at)
          .filter(t => t)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

        return {
          ...course,
          total_lessons: lessons.length,
          completed_lessons: completedCount,
          total_watch_time: totalWatchTime,
          last_study_time: lastStudyTime,
          progress_percentage: lessons.length > 0
            ? Math.round((completedCount / lessons.length) * 100)
            : 0
        };
      })
    );

    // 按最後學習時間排序
    coursesWithProgress.sort((a, b) => {
      if (!a.last_study_time) return 1;
      if (!b.last_study_time) return -1;
      return new Date(b.last_study_time).getTime() - new Date(a.last_study_time).getTime();
    });

    return NextResponse.json({
      success: true,
      courses: coursesWithProgress
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
