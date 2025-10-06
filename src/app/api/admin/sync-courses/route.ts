import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { verifyApiKey } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // 驗證 API 金鑰（開發環境下會自動通過）
    const authResult = await verifyApiKey(request);
    if (!authResult.valid && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();,
        { status: 500 }
      );
    }

    console.log('[Sync Courses API] Starting course synchronization...');

    // 1. 獲取所有已批准的課程申請
    const { data: approvedRequests, error: requestsError } = await supabase
      .from('course_requests')
      .select('course_id, course_title')
      .eq('status', 'approved');

    if (requestsError) {
      console.error('[Sync Courses API] Error fetching course requests:', requestsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch course requests' },
        { status: 500 }
      );
    }

    // 2. 獲取現有的 course_lessons
    const { data: existingLessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('course_id');

    if (lessonsError) {
      console.error('[Sync Courses API] Error fetching course lessons:', lessonsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch existing courses' },
        { status: 500 }
      );
    }

    // 3. 找出需要新增的課程（去重）
    const existingCourseIds = new Set(existingLessons?.map(l => l.course_id) || []);
    const coursesToAdd = new Map<string, string>();

    // 收集所有唯一的課程
    const uniqueCourses = new Map<string, string>();
    approvedRequests?.forEach(request => {
      if (request.course_id && request.course_title) {
        uniqueCourses.set(request.course_id, request.course_title);
      }
    });

    // 找出需要新增的課程
    uniqueCourses.forEach((title, courseId) => {
      if (!existingCourseIds.has(courseId)) {
        coursesToAdd.set(courseId, title);
        console.log(`[Sync Courses API] Need to add course: ${courseId} - ${title}`);
      }
    });

    // 4. 插入新課程 - 包含必要欄位
    const newCourses = Array.from(coursesToAdd.entries()).map(([courseId, title]) => ({
      id: `${courseId}_lesson_1`, // 生成唯一的 lesson ID
      course_id: courseId,
      slug: courseId.toLowerCase().replace(/[^a-z0-9]/g, '-'), // 生成 slug
      title: title
    }));

    if (newCourses.length > 0) {
      const { data: insertedCourses, error: insertError } = await supabase
        .from('course_lessons')
        .insert(newCourses)
        .select();

      if (insertError) {
        console.error('[Sync Courses API] Error inserting courses:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to insert courses: ' + insertError.message },
          { status: 500 }
        );
      }

      console.log(`[Sync Courses API] Inserted ${insertedCourses?.length || 0} new courses`);

      return NextResponse.json({
        success: true,
        message: `成功同步 ${insertedCourses?.length || 0} 個課程`,
        data: {
          added: insertedCourses,
          total: existingCourseIds.size + (insertedCourses?.length || 0)
        }
      });
    } else {
      console.log('[Sync Courses API] No new courses to sync');

      return NextResponse.json({
        success: true,
        message: '所有課程已同步',
        data: {
          added: [],
          total: existingCourseIds.size
        }
      });
    }

  } catch (error) {
    console.error('[Sync Courses API] Sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed: ' + (error as any).message },
      { status: 500 }
    );
  }
}