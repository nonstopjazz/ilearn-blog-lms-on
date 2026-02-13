import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/api-auth';
import { isAdmin } from '@/lib/security-config';

// GET - 取得上課進度列表
export async function GET(request: NextRequest) {
  try {
    // Cookie 認證
    const { user: authUser } = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    // 取得查詢參數
    const user_id = searchParams.get('user_id');
    // IDOR 防護：只允許查看自己的資料，除非是管理員
    const effectiveUserId = user_id && user_id !== authUser.id && isAdmin(authUser)
      ? user_id
      : authUser.id;
    const course_id = searchParams.get('course_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 查詢用戶的課程進度記錄
    let query = supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: progressRecords, error: progressError } = await query;

    if (progressError) {
      console.error('[Lessons Progress API] Database error:', progressError);
      return NextResponse.json(
        { success: false, error: progressError.message },
        { status: 500 }
      );
    }

    // 如果有進度記錄，獲取對應的課程資訊
    let lessonsMap = new Map();
    if (progressRecords && progressRecords.length > 0) {
      const lessonIds = progressRecords.map((r: any) => r.lesson_id);
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, course_id, title, slug, order_index, duration')
        .in('id', lessonIds);

      lessons?.forEach((lesson: any) => {
        lessonsMap.set(lesson.id, lesson);
      });
    }

    // 如果指定了 course_id，過濾結果
    let filteredRecords = progressRecords || [];
    if (course_id) {
      filteredRecords = filteredRecords.filter((record: any) => {
        const lesson = lessonsMap.get(record.lesson_id);
        return lesson?.course_id === course_id;
      });
    }

    // 轉換為前端需要的格式
    const progressData = filteredRecords.map((record: any) => {
      const lesson = lessonsMap.get(record.lesson_id);

      // 判斷狀態
      let status = 'not-started';
      if (record.completed) {
        status = 'completed';
      } else if (record.progress_percentage > 0 && record.progress_percentage < 80) {
        status = 'in-progress';
      } else if (record.progress_percentage === 0) {
        status = 'scheduled';
      }

      // 提取課程主題（從 title 中解析，或使用預設值）
      const topics: string[] = [];
      // 這裡可以根據實際需求從其他欄位提取或使用預設值

      return {
        id: record.id,
        date: record.created_at?.split('T')[0],
        lesson: lesson?.title || 'Unknown Lesson',
        lessonId: record.lesson_id,
        topics: topics, // 可以後續擴展
        status: status,
        duration: Math.round((lesson?.duration || 0) / 60), // 轉換為分鐘
        currentTime: record.current_time || 0,
        progress: record.progress_percentage || 0,
        completed: record.completed || false,
        courseId: lesson?.course_id,
        homework: '', // 可以後續從其他表 JOIN
        createdAt: record.created_at
      };
    });

    // 計算統計資料
    const totalLessons = progressData.length;
    const completedLessons = progressData.filter((p: any) => p.status === 'completed').length;
    const inProgressLessons = progressData.filter((p: any) => p.status === 'in-progress').length;
    const notStartedLessons = progressData.filter((p: any) =>
      p.status === 'not-started' || p.status === 'scheduled'
    ).length;

    // 計算總學習時間（分鐘）
    const totalDuration = progressData.reduce((sum: number, p: any) => {
      if (p.status === 'completed') {
        return sum + p.duration;
      }
      return sum;
    }, 0);

    // 計算平均進度
    const avgProgress = totalLessons > 0
      ? progressData.reduce((sum: number, p: any) => sum + p.progress, 0) / totalLessons
      : 0;

    // 完成率
    const completionRate = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    // 按狀態分組
    const byStatus: Record<string, number> = {
      'completed': completedLessons,
      'in-progress': inProgressLessons,
      'not-started': notStartedLessons,
      'scheduled': progressData.filter((p: any) => p.status === 'scheduled').length
    };

    // 按課程分組（如果有多個課程）
    const byCourse: Record<string, any> = {};
    progressData.forEach((p: any) => {
      const cid = p.courseId || 'unknown';
      if (!byCourse[cid]) {
        byCourse[cid] = {
          course_id: cid,
          total: 0,
          completed: 0,
          in_progress: 0,
          not_started: 0
        };
      }
      byCourse[cid].total++;
      if (p.status === 'completed') byCourse[cid].completed++;
      else if (p.status === 'in-progress') byCourse[cid].in_progress++;
      else byCourse[cid].not_started++;
    });

    const stats = {
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      in_progress_lessons: inProgressLessons,
      not_started_lessons: notStartedLessons,
      completion_rate: completionRate,
      average_progress: Math.round(avgProgress),
      total_duration_minutes: totalDuration,
      by_status: byStatus,
      by_course: Object.values(byCourse)
    };

    return NextResponse.json({
      success: true,
      data: progressData,
      stats: stats,
      metadata: {
        user_id: effectiveUserId,
        course_id: course_id,
        limit: limit,
        offset: offset,
        total_count: totalLessons
      }
    });

  } catch (error) {
    console.error('[Lessons Progress API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
