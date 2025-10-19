import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { Assignment, ApiResponse } from '@/types/learning-management';

// GET - 獲取作業列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const courseId = searchParams.get('course_id');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const isPublished = searchParams.get('is_published');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT
        a.*,
        cl.lesson_title,
        COALESCE(asub.submission_date, NULL) as submitted_date,
        COALESCE(asub.status, 'not_submitted') as submission_status,
        COALESCE(asub.score, NULL) as submission_score,
        CASE
          WHEN asub.submission_date IS NOT NULL THEN 'completed'
          WHEN a.due_date < CURRENT_DATE THEN 'overdue'
          WHEN a.due_date = CURRENT_DATE THEN 'due_today'
          ELSE 'pending'
        END as calculated_status
      FROM assignments a
      LEFT JOIN course_lessons cl ON cl.id = a.lesson_id
    `;

    const params: any[] = [];
    let paramCount = 0;

    // 如果有 student_id，在 JOIN 時就加入條件
    if (studentId) {
      paramCount++;
      query += ` LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = $${paramCount}`;
      params.push(studentId);
    } else {
      query += ` LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id`;
    }

    query += ` WHERE 1=1`;

    if (studentId) {
      // student_id 已在 JOIN 中使用，這裡可以用來篩選作業本身（如果需要）
      // 目前保持原有邏輯
    }

    if (courseId) {
      paramCount++;
      query += ` AND a.course_id = $${paramCount}`;
      params.push(courseId);
    }

    if (status) {
      paramCount++;
      query += ` AND asub.status = $${paramCount}`;
      params.push(status);
    }

    if (dateFrom) {
      paramCount++;
      query += ` AND a.due_date >= $${paramCount}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      query += ` AND a.due_date <= $${paramCount}`;
      params.push(dateTo);
    }

    if (isPublished !== null) {
      paramCount++;
      query += ` AND a.is_published = $${paramCount}`;
      params.push(isPublished === 'true');
    }

    query += ` ORDER BY a.due_date ASC, a.created_at DESC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await sql.query(query, params);

    // 轉換數據格式
    const assignments = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      lessonTitle: row.lesson_title,
      startDate: row.created_at,
      dueDate: row.due_date,
      completedDate: row.submitted_date,
      status: row.calculated_status,
      submissionStatus: row.submission_status,
      score: row.submission_score,
      maxScore: row.max_score || 100,
      priority: row.priority || 'medium',
      category: row.assignment_type || '一般作業',
      submissionType: row.submission_type || 'text',
      estimatedDuration: row.estimated_duration,
      progress: row.submitted_date ? 100 : 0,
      isRequired: row.is_required,
      isPublished: row.is_published,
      isDaily: row.is_daily || false,
      weekNumber: row.week_number,
      dailyType: row.daily_type,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const response: ApiResponse<any[]> = {
      success: true,
      data: assignments,
      message: `成功獲取 ${assignments.length} 項作業`
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
    const {
      title,
      description,
      courseId,
      lessonId,
      studentIds, // 陣列，支持批量分配
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
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位',
        message: '標題和截止日期為必填欄位'
      }, { status: 400 });
    }

    // 將空字串的 courseId 和 lessonId 轉為 null
    const normalizedCourseId = courseId || null;
    const normalizedLessonId = lessonId || null;

    // 創建一個作業記錄（不論有多少學生，只創建一個作業）
    const result = await sql`
      INSERT INTO assignments (
        title, description, course_id, lesson_id, due_date,
        assignment_type, priority, submission_type, max_score,
        estimated_duration, is_required, instructions, tags,
        resources, repeat_schedule, requirements, is_published,
        created_at, updated_at
      ) VALUES (
        ${title}, ${description}, ${normalizedCourseId}, ${normalizedLessonId}, ${dueDate},
        ${assignmentType || '一般作業'}, ${priority || 'medium'},
        ${submissionType || 'text'}, ${maxScore || 100},
        ${estimatedDuration || null}, ${isRequired || false}, ${instructions || null},
        ${JSON.stringify(tags || [])}, ${JSON.stringify(resources || [])},
        ${JSON.stringify(repeatSchedule || {})}, ${JSON.stringify(requirements || {})},
        ${true}, NOW(), NOW()
      ) RETURNING *
    `;

    const createdAssignment = result.rows[0];

    // 如果有指定學生列表，為每個學生創建初始的提交記錄（狀態為 not_submitted）
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      for (const studentId of studentIds) {
        await sql`
          INSERT INTO assignment_submissions (
            assignment_id, student_id, status, created_at, updated_at
          ) VALUES (
            ${createdAssignment.id}, ${studentId}, 'not_submitted', NOW(), NOW()
          )
        `;
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: createdAssignment,
      message: `成功創建作業${studentIds && studentIds.length > 0 ? `並分配給 ${studentIds.length} 位學生` : ''}`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('新增作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '新增作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}