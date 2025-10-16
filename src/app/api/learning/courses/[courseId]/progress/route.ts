import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const { courseId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少 user_id 參數' },
        { status: 400 }
      );
    }

    // 查詢課程單元
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('id, title, order_index, video_duration')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (lessonsError) {
      console.error('查詢課程單元失敗:', lessonsError);
      return NextResponse.json(
        { success: false, error: '查詢課程單元失敗' },
        { status: 500 }
      );
    }

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({
        success: true,
        lessons: []
      });
    }

    const lessonIds = lessons.map(l => l.id);

    // 查詢用戶進度 - 使用實際的數據庫欄位名稱
    const { data: progress, error: progressError } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, progress_percent, completed, watched_duration, completed_at, created_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);

    if (progressError) {
      console.error('查詢用戶進度失敗:', progressError);
      return NextResponse.json(
        { success: false, error: '查詢用戶進度失敗' },
        { status: 500 }
      );
    }

    // 組合資料
    const lessonsWithProgress = lessons.map(lesson => {
      const userProgress = progress?.find(p => p.lesson_id === lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        order_index: lesson.order_index,
        video_duration: lesson.video_duration,
        progress_percentage: userProgress?.progress_percent || 0,
        completed: userProgress?.completed || false,
        current_time: userProgress?.watched_duration || 0,
        last_watched_at: userProgress?.completed_at || userProgress?.created_at || null
      };
    });

    return NextResponse.json({
      success: true,
      lessons: lessonsWithProgress
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
