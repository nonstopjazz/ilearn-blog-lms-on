import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { ApiResponse } from '@/types/learning-management';

// GET - 獲取作業列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const courseId = searchParams.get('course_id');
    const isPublished = searchParams.get('is_published');

    const supabase = createSupabaseAdminClient();

    // 建立查詢
    let query = supabase
      .from('assignments')
      .select(`
        *,
        assignment_submissions (
          id,
          student_id,
          submission_date,
          status,
          score
        )
      `);

    // 篩選條件
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (isPublished !== null) {
      query = query.eq('is_published', isPublished === 'true');
    }

    // 如果有 studentId，過濾該學生的提交記錄
    if (studentId) {
      query = query.eq('assignment_submissions.student_id', studentId);
    }

    query = query.order('due_date', { ascending: true });

    const { data: assignments, error } = await query;

    if (error) {
      console.error('獲取作業列表失敗:', error);
      throw error;
    }

    // 轉換數據格式
    const formattedAssignments = (assignments || []).map((row: any) => {
      const submission = studentId && row.assignment_submissions
        ? row.assignment_submissions.find((s: any) => s.student_id === studentId)
        : null;

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        courseId: row.course_id,
        lessonId: row.lesson_id,
        startDate: row.created_at,
        dueDate: row.due_date,
        completedDate: submission?.submission_date,
        status: submission
          ? (submission.status === 'graded' ? 'completed' : 'pending')
          : (row.due_date && new Date(row.due_date) < new Date() ? 'overdue' : 'pending'),
        submissionStatus: submission?.status || 'not_submitted',
        score: submission?.score,
        maxScore: row.max_score || 100,
        priority: row.priority || 'medium',
        category: row.assignment_type || '一般作業',
        submissionType: row.submission_type || 'text',
        estimatedDuration: row.estimated_duration,
        progress: submission ? 100 : 0,
        isRequired: row.is_required,
        isPublished: row.is_published,
        isDaily: row.is_daily || false,
        weekNumber: row.week_number,
        dailyType: row.daily_type,
        tags: row.tags || [],
        resources: row.resources || [],
        instructions: row.instructions,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: formattedAssignments,
      message: `成功獲取 ${formattedAssignments.length} 項作業`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('獲取作業列表失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '獲取作業列表失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST - 新增作業
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[POST /api/assignments] 收到請求:', JSON.stringify(body, null, 2));

    const {
      title,
      description,
      courseId,
      lessonId,
      studentIds,
      dueDate,
      assignmentType,
      priority,
      submissionType,
      maxScore,
      estimatedDuration,
      isRequired,
      instructions,
      tags,
      resources,
      repeatSchedule,
      requirements
    } = body;

    // 驗證必填欄位
    if (!title || !dueDate) {
      console.error('[POST /api/assignments] 缺少必填欄位:', { title, dueDate });
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位',
        message: '標題和截止日期為必填欄位'
      }, { status: 400 });
    }

    // 驗證學生 ID 格式 (應該是 UUID)
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = studentIds.filter(id => !uuidRegex.test(id));
      if (invalidIds.length > 0) {
        console.error('[POST /api/assignments] 無效的學生 ID 格式:', invalidIds);
        return NextResponse.json({
          success: false,
          error: '無效的學生 ID 格式',
          message: `以下學生 ID 格式不正確: ${invalidIds.join(', ')}`
        }, { status: 400 });
      }
    }

    const supabase = createSupabaseAdminClient();

    // 如果沒有提供 courseId,嘗試從學生的課程註冊記錄中獲取
    let finalCourseId = courseId;

    if (!finalCourseId && studentIds && studentIds.length > 0) {
      console.log('[POST /api/assignments] 未提供 courseId,嘗試從學生課程註冊中獲取...');

      // 查詢第一位學生的課程註冊記錄
      const { data: courseRequests, error: courseError } = await supabase
        .from('course_requests')
        .select('course_id, course_title')
        .eq('user_id', studentIds[0])
        .eq('status', 'approved')
        .limit(1);

      if (!courseError && courseRequests && courseRequests.length > 0) {
        finalCourseId = courseRequests[0].course_id;
        console.log('[POST /api/assignments] 自動使用課程:', finalCourseId, courseRequests[0].course_title);
      } else {
        console.log('[POST /api/assignments] 無法找到學生的課程註冊記錄');
      }
    }

    // 如果還是沒有 courseId,使用第一個可用課程
    if (!finalCourseId) {
      console.log('[POST /api/assignments] 仍無 courseId,嘗試使用第一個可用課程...');

      const { data: courses, error: coursesError } = await supabase
        .from('course_lessons')
        .select('course_id')
        .limit(1);

      if (!coursesError && courses && courses.length > 0) {
        finalCourseId = courses[0].course_id;
        console.log('[POST /api/assignments] 使用預設課程:', finalCourseId);
      }
    }

    // 最後的保底措施
    if (!finalCourseId) {
      console.error('[POST /api/assignments] 無法確定 course_id');
      return NextResponse.json({
        success: false,
        error: '無法確定課程',
        message: '請提供 courseId 或確保學生已註冊課程'
      }, { status: 400 });
    }

    // 準備插入的資料
    // 某些欄位有 CHECK 約束,需要謹慎處理
    const insertData: any = {
      title,
      description: description || null,
      course_id: finalCourseId,
      lesson_id: lessonId || null,
      due_date: dueDate,
      submission_type: submissionType || 'text',
      max_score: maxScore || 100,
      estimated_duration: estimatedDuration || null,
      is_required: isRequired || false,
      instructions: instructions || null,
      tags: tags || [],
      resources: resources || [],
      repeat_schedule: repeatSchedule || {},
      requirements: requirements || {},
      is_published: true,
    };

    // assignment_type 欄位有 CHECK 約束
    // 前端使用中文,需要映射到資料庫允許的值
    if (assignmentType) {
      const typeMapping: Record<string, string> = {
        '一般作業': 'general',
        '每日作業': 'daily',
        '週作業': 'weekly',
        '專案作業': 'project',
        '口說練習': 'speaking',
        '聽力作業': 'listening',
        '閱讀理解': 'reading',
        '寫作練習': 'writing',
        '文法練習': 'grammar',
        '單字測驗': 'vocabulary'
      };

      // 如果是中文,轉換為英文;否則直接使用
      const mappedType = typeMapping[assignmentType] || assignmentType;
      insertData.assignment_type = mappedType;
      console.log('[POST /api/assignments] assignment_type 映射:', assignmentType, '->', mappedType);
    }

    // priority 欄位也有 CHECK 約束
    // 前端使用中文,需要映射到資料庫允許的值
    if (priority) {
      const priorityMapping: Record<string, string> = {
        '低': 'low',
        '中': 'medium',
        '普通': 'normal',
        '高': 'high',
        '緊急': 'urgent'
      };

      // 如果是中文,轉換為英文;否則直接使用
      const mappedPriority = priorityMapping[priority] || priority;
      insertData.priority = mappedPriority;
      console.log('[POST /api/assignments] priority 映射:', priority, '->', mappedPriority);
    }

    console.log('[POST /api/assignments] 準備插入作業:', JSON.stringify(insertData, null, 2));

    // 創建一個作業記錄
    const { data: createdAssignment, error: insertError } = await supabase
      .from('assignments')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/assignments] 新增作業失敗:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      throw new Error(`資料庫錯誤: ${insertError.message} (${insertError.code})`);
    }

    console.log('[POST /api/assignments] 作業創建成功:', createdAssignment);

    // 如果有指定學生列表，為每個學生創建初始的提交記錄
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      const submissions = studentIds.map(studentId => ({
        assignment_id: createdAssignment.id,
        student_id: studentId,
        status: 'not_submitted'
      }));

      console.log('[POST /api/assignments] 準備插入提交記錄:', JSON.stringify(submissions, null, 2));

      const { error: submissionError } = await supabase
        .from('assignment_submissions')
        .insert(submissions);

      if (submissionError) {
        console.error('[POST /api/assignments] 創建提交記錄失敗:', {
          error: submissionError,
          code: submissionError.code,
          message: submissionError.message,
          details: submissionError.details,
          hint: submissionError.hint
        });
        // 不中斷，只記錄錯誤
      } else {
        console.log('[POST /api/assignments] 提交記錄創建成功');
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: createdAssignment,
      message: `成功創建作業${studentIds && studentIds.length > 0 ? `並分配給 ${studentIds.length} 位學生` : ''}`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[POST /api/assignments] 新增作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '新增作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
