// src/app/api/courses/[courseId]/lessons/route.js
import { getSupabaseClient } from '@/lib/supabase-server';

// 獲取課程的所有單元和使用者進度
export async function GET(request, { params }) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ 
        error: 'Supabase 初始化失敗' 
      }, { status: 500 });
    }
    const { courseId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    console.log('🔍 API: 獲取課程單元', { courseId, userId });

    // 首先檢查課程是否存在
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('❌ 課程不存在:', courseError);
      return Response.json({ 
        error: '課程不存在',
        details: courseError?.message 
      }, { status: 404 });
    }

    console.log('✅ 找到課程:', course.title);

    // 獲取課程單元
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select(`
        id,
        course_id,
        title,
        slug,
        description,
        content,
        lesson_type,
        video_url,
        video_duration,
        order_index,
        is_preview,
        is_published,
        created_at,
        updated_at
      `)
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (lessonsError) {
      console.error('❌ 獲取課程單元失敗:', lessonsError);
      return Response.json({ 
        error: '獲取課程單元失敗：' + lessonsError.message 
      }, { status: 500 });
    }

    console.log(`✅ 找到 ${lessons?.length || 0} 個課程單元`);

    // 即使沒有課程單元，也要返回成功，讓前端處理
    // 如果提供了 user_id，獲取使用者的學習進度
    let lessonsWithProgress = lessons || [];
    
    if (userId && lessons && lessons.length > 0) {
      console.log('🔍 獲取使用者進度...');
      
      const lessonIds = lessons.map(lesson => lesson.id);
      
      const { data: progressData, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select(`
          lesson_id,
          progress_percentage,
          completed,
          current_time,
          updated_at
        `)
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      if (progressError) {
        console.error('❌ 獲取進度失敗:', progressError);
        // 不要因為進度獲取失敗就中止，繼續返回課程單元
      } else {
        console.log(`✅ 找到 ${progressData?.length || 0} 個進度記錄`);
      }

      // 將進度資料合併到課程單元中
      lessonsWithProgress = lessons.map(lesson => {
        const progress = progressData?.find(p => p.lesson_id === lesson.id);
        
        return {
          ...lesson,
          user_progress: progress ? {
            user_id: userId,
            lesson_id: lesson.id,
            progress_percentage: progress.progress_percentage || 0,
            completed: progress.completed || false,
            current_time: progress.current_time || 0,
            updated_at: progress.updated_at
          } : null
        };
      });
    }

    console.log('✅ 處理完成，返回資料');

    return Response.json({
      success: true,
      lessons: lessonsWithProgress,
      course: {
        id: course.id,
        title: course.title
      }
    });

  } catch (error) {
    console.error('💥 API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}