import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { ApiResponse } from '@/types/learning-management';

// POST - 批次建立專案作業
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位',
        message: '需要提供作業陣列'
      }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const results: any[] = [];
    const errors: any[] = [];

    // 獲取所有學生資料（用於姓名/email 查詢）
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const usersByEmail = new Map(allUsers.users.map(u => [u.email?.toLowerCase(), u]));
    const usersByName = new Map(
      allUsers.users.map(u => {
        const name = u.user_metadata?.full_name || u.user_metadata?.name || '';
        return [name.toLowerCase(), u];
      })
    );

    // 批次處理每個作業
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];

      try {
        // 驗證必填欄位
        if (!assignment.title) {
          errors.push({
            index: i,
            assignment: assignment,
            error: '缺少必填欄位（title）'
          });
          continue;
        }

        // 支援三種方式指定學生：studentIds (UUID), studentEmails, studentNames
        let studentIds: string[] = [];

        if (assignment.studentIds && assignment.studentIds.length > 0) {
          // 方式 1: 直接使用 UUID
          studentIds = assignment.studentIds;
        } else if (assignment.studentEmails && assignment.studentEmails.length > 0) {
          // 方式 2: 使用 email
          for (const email of assignment.studentEmails) {
            const user = usersByEmail.get(email.toLowerCase());
            if (user) {
              studentIds.push(user.id);
            } else {
              console.warn(`找不到 email 為 ${email} 的學生`);
            }
          }
        } else if (assignment.studentNames && assignment.studentNames.length > 0) {
          // 方式 3: 使用姓名
          for (const name of assignment.studentNames) {
            const user = usersByName.get(name.toLowerCase());
            if (user) {
              studentIds.push(user.id);
            } else {
              console.warn(`找不到姓名為 ${name} 的學生`);
            }
          }
        }

        if (studentIds.length === 0) {
          errors.push({
            index: i,
            assignment: assignment,
            error: '找不到任何學生（請提供 studentIds, studentEmails 或 studentNames）'
          });
          continue;
        }

        // 建立作業
        const assignmentData = {
          title: assignment.title,
          description: assignment.description || '',
          course_id: assignment.courseId || null,
          due_date: assignment.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 預設7天後
          is_project_assignment: true,
          is_published: assignment.isPublished !== undefined ? assignment.isPublished : false, // 預設為未發布，需要 admin 登記後才發布
          submission_type: assignment.submissionType || 'file',
          max_score: assignment.maxScore || 100,
          estimated_duration: assignment.estimatedDuration || 120,
          priority: assignment.priority || 'normal',
          requirements: assignment.requirements || [],
          instructions: assignment.instructions || '',
          tags: [...(assignment.tags || []), '專案作業'],
          resources: assignment.resources || []
        };

        console.log(`[批次上傳] 作業 ${i}: 準備建立`, assignmentData);

        const { data: newAssignment, error: assignmentError } = await supabase
          .from('assignments')
          .insert(assignmentData)
          .select()
          .single();

        if (assignmentError) {
          console.error(`[批次上傳] 作業 ${i} 建立失敗:`, assignmentError);
          errors.push({
            index: i,
            assignment: assignment,
            error: assignmentError.message
          });
          continue;
        }

        console.log(`[批次上傳] 作業 ${i} 建立成功:`, newAssignment.id);

        // 為每個學生建立提交記錄
        const submissionInserts = studentIds.map((studentId: string) => ({
          assignment_id: newAssignment.id,
          student_id: studentId,
          status: 'not_started'
        }));

        console.log(`[批次上傳] 作業 ${i}: 準備建立 ${submissionInserts.length} 筆提交記錄`, submissionInserts);

        const { error: submissionError } = await supabase
          .from('assignment_submissions')
          .insert(submissionInserts);

        if (submissionError) {
          console.error(`[批次上傳] 作業 ${i} 提交記錄建立失敗:`, submissionError);
          errors.push({
            index: i,
            assignment: assignment,
            error: `作業建立成功但提交記錄建立失敗: ${submissionError.message}`
          });
          continue;
        }

        console.log(`[批次上傳] 作業 ${i} 提交記錄建立成功`);

        results.push({
          index: i,
          assignmentId: newAssignment.id,
          title: newAssignment.title,
          studentCount: studentIds.length,
          success: true
        });

      } catch (error) {
        errors.push({
          index: i,
          assignment: assignment,
          error: error instanceof Error ? error.message : '未知錯誤'
        });
      }
    }

    const response: ApiResponse<any> = {
      success: errors.length === 0,
      data: {
        successCount: results.length,
        errorCount: errors.length,
        results: results,
        errors: errors
      },
      message: `批次處理完成：成功 ${results.length} 項，失敗 ${errors.length} 項`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('批次建立專案作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '批次建立專案作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
