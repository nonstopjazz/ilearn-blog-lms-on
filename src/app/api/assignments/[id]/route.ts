import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ApiResponse } from '@/types/learning-management';

// GET - 獲取特定作業詳情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;

    const result = await sql`
      SELECT
        a.*,
        asub.id as submission_id,
        asub.submission_date,
        asub.content as submission_content,
        asub.file_url,
        asub.score as submission_score,
        asub.feedback,
        asub.status as submission_status,
        asub.is_late
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
      WHERE a.id = ${assignmentId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '作業不存在',
        message: `找不到ID為 ${assignmentId} 的作業`
      }, { status: 404 });
    }

    const assignment = result.rows[0];

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        courseId: assignment.course_id,
        lessonId: assignment.lesson_id,
        dueDate: assignment.due_date,
        assignmentType: assignment.assignment_type,
        priority: assignment.priority,
        submissionType: assignment.submission_type,
        maxScore: assignment.max_score,
        estimatedDuration: assignment.estimated_duration,
        isRequired: assignment.is_required,
        isPublished: assignment.is_published,
        tags: assignment.tags || [],
        resources: assignment.resources || [],
        requirements: assignment.requirements || {},
        repeatSchedule: assignment.repeat_schedule || {},
        submission: assignment.submission_id ? {
          id: assignment.submission_id,
          submissionDate: assignment.submission_date,
          content: assignment.submission_content,
          fileUrl: assignment.file_url,
          score: assignment.submission_score,
          feedback: assignment.feedback,
          status: assignment.submission_status,
          isLate: assignment.is_late
        } : null,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('獲取作業詳情失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '獲取作業詳情失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT - 更新作業
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const body = await request.json();

    const {
      title,
      description,
      instructions,
      dueDate,
      assignmentType,
      priority,
      submissionType,
      maxScore,
      estimatedDuration,
      isRequired,
      isPublished,
      tags,
      resources,
      requirements,
      repeatSchedule
    } = body;

    const result = await sql`
      UPDATE assignments SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        instructions = COALESCE(${instructions}, instructions),
        due_date = COALESCE(${dueDate}, due_date),
        assignment_type = COALESCE(${assignmentType}, assignment_type),
        priority = COALESCE(${priority}, priority),
        submission_type = COALESCE(${submissionType}, submission_type),
        max_score = COALESCE(${maxScore}, max_score),
        estimated_duration = COALESCE(${estimatedDuration}, estimated_duration),
        is_required = COALESCE(${isRequired}, is_required),
        is_published = COALESCE(${isPublished}, is_published),
        tags = COALESCE(${JSON.stringify(tags)}, tags),
        resources = COALESCE(${JSON.stringify(resources)}, resources),
        requirements = COALESCE(${JSON.stringify(requirements)}, requirements),
        repeat_schedule = COALESCE(${JSON.stringify(repeatSchedule)}, repeat_schedule),
        updated_at = NOW()
      WHERE id = ${assignmentId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '作業不存在',
        message: `找不到ID為 ${assignmentId} 的作業`
      }, { status: 404 });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: '作業更新成功'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('更新作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '更新作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE - 刪除作業
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;

    // 首先檢查作業是否存在
    const checkResult = await sql`
      SELECT id FROM assignments WHERE id = ${assignmentId}
    `;

    if (checkResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '作業不存在',
        message: `找不到ID為 ${assignmentId} 的作業`
      }, { status: 404 });
    }

    // 刪除相關的提交記錄（CASCADE應該自動處理，但為了安全起見）
    await sql`
      DELETE FROM assignment_submissions WHERE assignment_id = ${assignmentId}
    `;

    // 刪除作業
    const result = await sql`
      DELETE FROM assignments WHERE id = ${assignmentId}
      RETURNING id
    `;

    const response: ApiResponse<any> = {
      success: true,
      data: { deletedId: result.rows[0].id },
      message: '作業刪除成功'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('刪除作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '刪除作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}