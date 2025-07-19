// src/app/api/courses/route.js
import { getSupabaseClient } from '@/lib/supabase-server';

// 獲取所有課程
export async function GET(request) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ 
        error: 'Supabase 初始化失敗' 
      }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('courses')
      .select(`
        *,
        lessons:course_lessons(count)
      `)
      .order('created_at', { ascending: false });

    // 狀態篩選
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error('查詢課程失敗:', error);
      return Response.json({ 
        error: '查詢課程失敗：' + error.message 
      }, { status: 500 });
    }

    // 📊 統計每個課程的真實學員人數（已核准的申請）
    const courseIds = courses ? courses.map(course => course.id) : [];
    
    // 查詢所有已核准的課程申請
    const { data: enrollmentStats, error: statsError } = await supabase
      .from('course_requests')
      .select('course_id')
      .eq('status', 'approved')
      .in('course_id', courseIds);

    if (statsError) {
      console.error('統計學員人數失敗:', statsError);
    }

    // 計算每個課程的學員人數
    const enrollmentCounts = {};
    if (enrollmentStats) {
      enrollmentStats.forEach(request => {
        enrollmentCounts[request.course_id] = (enrollmentCounts[request.course_id] || 0) + 1;
      });
    }

    // 將真實學員人數加入課程資料
    const coursesWithEnrollment = courses ? courses.map(course => ({
      ...course,
      enrolled_count: enrollmentCounts[course.id] || 0
    })) : [];

    // 應用搜尋篩選 - 修復：使用存在的欄位
    let filteredCourses = coursesWithEnrollment;
    if (search) {
      filteredCourses = filteredCourses.filter(course =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return Response.json({
      success: true,
      courses: filteredCourses
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 建立新課程
export async function POST(request) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ 
        error: 'Supabase 初始化失敗' 
      }, { status: 500 });
    }
    const courseData = await request.json();
    console.log('收到的課程資料:', courseData);

    // 驗證必要欄位
    if (!courseData.title || !courseData.description || !courseData.instructor_name) {
      return Response.json({ 
        error: '缺少必要欄位：標題、描述或講師姓名' 
      }, { status: 400 });
    }

    // 🔥 新增：生成正確格式的課程 ID
    const { data: maxIdData } = await supabase
      .from('courses')
      .select('id')
      .like('id', 'course_%')
      .order('id', { ascending: false })
      .limit(1);

    let nextCourseNumber = 1;
    if (maxIdData && maxIdData.length > 0) {
      const lastId = maxIdData[0].id;
      const match = lastId.match(/course_(\d+)/);
      if (match) {
        nextCourseNumber = parseInt(match[1]) + 1;
      }
    }

    const courseId = `course_${nextCourseNumber.toString().padStart(3, '0')}`;
    console.log('生成的課程 ID:', courseId);

    // 🔥 修復：只插入資料表實際存在的欄位
    const insertData = {
      id: courseId, // 🔥 使用自訂格式的 ID
      title: courseData.title,
      description: courseData.description,
      thumbnail_url: courseData.thumbnail_url || null,
      instructor_name: courseData.instructor_name || null,
      price: courseData.price || 0,
      is_free: (courseData.price || 0) === 0,
      category: courseData.category || null,
      difficulty_level: courseData.level || 'beginner',
      duration_hours: Math.ceil((courseData.duration_minutes || 0) / 60),
      status: courseData.status || 'draft',
      lessons_count: courseData.lessons?.length || 0,
    };

    console.log('準備插入的資料:', insertData);

    // 建立課程
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert(insertData)
      .select()
      .single();

    if (courseError) {
      console.error('建立課程失敗:', courseError);
      return Response.json({ 
        error: '建立課程失敗：' + courseError.message 
      }, { status: 500 });
    }

    console.log('課程建立成功:', course);

    // 🔥 修復：建立課程內容
    if (courseData.lessons && courseData.lessons.length > 0) {
      // 生成 slug 的輔助函數
      const generateSlug = (title, index) => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-') // 支援中文
          .replace(/^-+|-+$/g, '')
          .substring(0, 50) + `-${index + 1}`;
      };

      const lessonsToInsert = courseData.lessons.map((lesson, index) => ({
        id: `lesson_${nextCourseNumber.toString().padStart(3, '0')}_${(index + 1).toString().padStart(2, '0')}`, // 🔥 修正：使用正確的 lesson ID 格式
        course_id: courseId,
        title: lesson.title,
        slug: generateSlug(lesson.title, index),
        description: lesson.description || null,
        content: lesson.content || null,
        lesson_type: 'video',
        video_url: lesson.video_url || null,
        video_duration: lesson.video_duration || lesson.duration_minutes || 0,
        order_index: index,
        is_preview: lesson.is_preview || false,
        is_published: true,
        attachments: lesson.attachments || []
      }));

      console.log('準備插入的課程內容:', lessonsToInsert);

      const { data: insertedLessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .insert(lessonsToInsert)
        .select();

      if (lessonsError) {
        console.error('建立課程內容失敗:', lessonsError);
        // 可以選擇是否要刪除已建立的課程
        return Response.json({ 
          error: '建立課程內容失敗：' + lessonsError.message 
        }, { status: 500 });
      }

      console.log('課程內容建立成功:', insertedLessons);
    }

    return Response.json({
      success: true,
      course,
      message: '課程建立成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 更新課程
export async function PUT(request, { params }) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ 
        error: 'Supabase 初始化失敗' 
      }, { status: 500 });
    }
    const { courseId } = params;
    const updateData = await request.json();

    // 🔥 修復：只更新資料表實際存在的欄位
    const updateFields = {
      title: updateData.title,
      description: updateData.description,
      thumbnail_url: updateData.thumbnail_url,
      instructor_name: updateData.instructor_name, // 🔥 新增：支援講師姓名
      price: updateData.price,
      is_free: (updateData.price || 0) === 0,
      difficulty_level: updateData.level, // 修復：使用正確欄位名
      category: updateData.category,
      status: updateData.status,
      updated_at: new Date().toISOString()
      // 移除不存在的欄位：short_description, tags
    };

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .update(updateFields)
      .eq('id', courseId)
      .select()
      .single();

    if (courseError) {
      console.error('更新課程失敗:', courseError);
      return Response.json({ 
        error: '更新課程失敗：' + courseError.message 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      course,
      message: '課程更新成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 刪除課程
export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ 
        error: 'Supabase 初始化失敗' 
      }, { status: 500 });
    }
    const { courseId } = params;

    // 檢查是否有學員已註冊
    const { count: enrollmentCount } = await supabase
      .from('user_course_access')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (enrollmentCount && enrollmentCount > 0) {
      return Response.json({ 
        error: '無法刪除已有學員註冊的課程' 
      }, { status: 400 });
    }

    // 刪除相關的課程內容
    await supabase
      .from('course_lessons')
      .delete()
      .eq('course_id', courseId);

    // 刪除課程
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (deleteError) {
      console.error('刪除課程失敗:', deleteError);
      return Response.json({ 
        error: '刪除課程失敗：' + deleteError.message 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: '課程已刪除'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}