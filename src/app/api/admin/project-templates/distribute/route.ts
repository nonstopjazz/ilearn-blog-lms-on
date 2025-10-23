import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { ApiResponse } from '@/types/learning-management';

// POST - 派發專案作業模板給學生
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, studentIds, startDate, courseId } = body;

    if (!templateId || !studentIds || studentIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位',
        message: '需要提供模板 ID 和至少一個學生 ID'
      }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // 1. 獲取模板資料
    const { data: template, error: templateError } = await supabase
      .from('project_assignment_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('找不到指定的專案模板');
    }

    const templateAssignments = template.assignments as any[];
    const distributionResults: any[] = [];

    // 2. 為每個學生建立作業
    for (const studentId of studentIds) {
      const createdAssignmentIds: string[] = [];

      // 計算作業的開始日期（逐步遞增）
      let currentDate = startDate ? new Date(startDate) : new Date();

      for (let i = 0; i < templateAssignments.length; i++) {
        const templateAssignment = templateAssignments[i];

        // 計算截止日期（根據預估時長）
        const dueDate = new Date(currentDate);
        const daysToAdd = Math.ceil((templateAssignment.estimatedDuration || 120) / 60 / 8); // 以每天8小時計算
        dueDate.setDate(dueDate.getDate() + daysToAdd);

        // 建立作業
        const { data: newAssignment, error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            title: templateAssignment.title,
            description: templateAssignment.description,
            course_id: courseId || null,
            due_date: dueDate.toISOString(),
            is_project_assignment: true,
            template_id: templateId,
            is_published: true,
            submission_type: 'file',
            max_score: 100,
            estimated_duration: templateAssignment.estimatedDuration,
            requirements: templateAssignment.requirements || [],
            tags: [...(template.tags || []), '專案作業'],
            priority: i === 0 ? 'high' : i === templateAssignments.length - 1 ? 'urgent' : 'normal'
          })
          .select()
          .single();

        if (assignmentError) {
          console.error('建立作業失敗:', assignmentError);
          continue;
        }

        createdAssignmentIds.push(newAssignment.id);

        // 建立學生的提交記錄（狀態為 not_started）
        const { error: submissionError } = await supabase
          .from('assignment_submissions')
          .insert({
            assignment_id: newAssignment.id,
            student_id: studentId,
            status: 'not_started'
          });

        if (submissionError) {
          console.error('建立提交記錄失敗:', submissionError);
        }

        // 下一個作業的開始日期為上一個作業的截止日期之後
        currentDate = new Date(dueDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 3. 記錄派發歷史
      const { error: distributionError } = await supabase
        .from('project_assignment_distributions')
        .insert({
          template_id: templateId,
          student_id: studentId,
          assignment_ids: createdAssignmentIds
        });

      if (distributionError) {
        console.error('記錄派發歷史失敗:', distributionError);
      }

      distributionResults.push({
        studentId,
        assignmentCount: createdAssignmentIds.length,
        assignmentIds: createdAssignmentIds
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: distributionResults,
      message: `成功為 ${studentIds.length} 位學生派發專案作業`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('派發專案作業失敗:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '派發專案作業失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
