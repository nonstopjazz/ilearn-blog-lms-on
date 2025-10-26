import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ApiResponse } from '@/types/learning-management';

// POST - 提交作業
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const body = await request.json();

    const {
      studentId,
      content,
      fileUrl,
      submissionType
    } = body;

    // 驗證必填欄位
    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少學生ID',
        message: '學生ID為必填欄位'
      }, { status: 400 });
    }

    // 檢查作業是否存在
    const assignmentResult = await sql`
      SELECT * FROM assignments WHERE id = ${assignmentId}
    `;

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '作業不存在',
        message: `找不到ID為 ${assignmentId} 的作業`
      }, { status: 404 });
    }

    const assignment = assignmentResult.rows[0];
    const currentDate = new Date();
    const dueDate = new Date(assignment.due_date);
    const isLate = currentDate > dueDate;

    // 檢查是否已經提交過
    const existingSubmission = await sql`
      SELECT id FROM assignment_submissions
      WHERE assignment_id = ${assignmentId} AND student_id = ${studentId}
    `;

    let result;

    if (existingSubmission.rows.length > 0) {
      // 更新現有提交
      result = await sql`
        UPDATE assignment_submissions SET
          content = ${content},
          file_url = ${fileUrl},
          submission_type = ${submissionType || 'text'},
          submission_date = NOW(),
          is_late = ${isLate},
          status = 'submitted',
          updated_at = NOW()
        WHERE id = ${existingSubmission.rows[0].id}
        RETURNING *
      `;
    } else {
      // 創建新提交
      result = await sql`
        INSERT INTO assignment_submissions (
          assignment_id, student_id, content, file_url,
          submission_type, submission_date, is_late, status,
          created_at, updated_at
        ) VALUES (
          ${assignmentId}, ${studentId}, ${content}, ${fileUrl},
          ${submissionType || 'text'}, NOW(), ${isLate}, 'submitted',
          NOW(), NOW()
        ) RETURNING *
      `;
    }

    const submission = result.rows[0];

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: submission.id,
        assignmentId: submission.assignment_id,
        studentId: submission.student_id,
        content: submission.content,
        fileUrl: submission.file_url,
        submissionType: submission.submission_type,
        submissionDate: submission.submission_date,
        isLate: submission.is_late,
        status: submission.status,
        score: submission.score,
        feedback: submission.feedback
      },
      message: existingSubmission.rows.length > 0 ? '作業重新提交成功' : '作業提交成功'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('提交作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '提交作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT - 批改作業（老師使用）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const body = await request.json();

    const {
      submissionId,
      score,
      feedback,
      status,
      gradedBy
    } = body;

    // 驗證必填欄位
    if (!submissionId) {
      return NextResponse.json({
        success: false,
        error: '缺少提交ID',
        message: '提交ID為必填欄位'
      }, { status: 400 });
    }

    // 更新提交記錄
    const result = await sql`
      UPDATE assignment_submissions SET
        score = ${score},
        feedback = ${feedback},
        status = ${status || 'graded'},
        graded_by = ${gradedBy},
        graded_at = NOW(),
        updated_at = NOW()
      WHERE id = ${submissionId} AND assignment_id = ${assignmentId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '提交記錄不存在',
        message: `找不到ID為 ${submissionId} 的提交記錄`
      }, { status: 404 });
    }

    const submission = result.rows[0];

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: submission.id,
        assignmentId: submission.assignment_id,
        studentId: submission.student_id,
        score: submission.score,
        maxScore: submission.max_score,
        feedback: submission.feedback,
        status: submission.status,
        gradedBy: submission.graded_by,
        gradedAt: submission.graded_at
      },
      message: '作業批改完成'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('批改作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '批改作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}