import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// POST - 一鍵設定學生名稱並修復所有專案作業
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentEmail, fullName, fixAssignments = true } = body;

    if (!studentEmail || !fullName) {
      return NextResponse.json({
        success: false,
        error: '缺少必填參數',
        message: '需要提供 studentEmail 和 fullName'
      }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const results: any = {
      updateName: null,
      fixAssignments: null
    };

    // 步驟 1: 找到學生
    console.log('[設定] 尋找學生:', studentEmail);
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const student = allUsers.users.find(u => u.email?.toLowerCase() === studentEmail.toLowerCase());

    if (!student) {
      return NextResponse.json({
        success: false,
        error: '找不到學生',
        message: `找不到 ${studentEmail} 的學生資料`
      }, { status: 404 });
    }

    console.log('[設定] 找到學生:', student.id);

    // 步驟 2: 更新名稱
    console.log('[設定] 更新名稱為:', fullName);
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      student.id,
      {
        user_metadata: {
          ...student.user_metadata,
          full_name: fullName
        }
      }
    );

    if (updateError) {
      console.error('[設定] 更新名稱失敗:', updateError);
      throw new Error(`更新名稱失敗: ${updateError.message}`);
    }

    results.updateName = {
      success: true,
      email: studentEmail,
      fullName: fullName
    };

    console.log('[設定] 名稱更新成功');

    // 步驟 3: 修復專案作業（如果需要）
    if (fixAssignments) {
      console.log('[設定] 開始修復專案作業...');

      // 3.1 獲取所有專案作業
      const { data: allProjectAssignments } = await supabase
        .from('assignments')
        .select('id, title')
        .eq('is_project_assignment', true);

      console.log('[設定] 找到', allProjectAssignments?.length, '個專案作業');

      // 3.2 獲取該學生現有的提交記錄
      const { data: existingSubmissions } = await supabase
        .from('assignment_submissions')
        .select('assignment_id')
        .eq('student_id', student.id);

      const existingAssignmentIds = new Set(existingSubmissions?.map(s => s.assignment_id) || []);

      // 3.3 找出需要補建的作業
      const assignmentsToFix = (allProjectAssignments || [])
        .filter(a => !existingAssignmentIds.has(a.id));

      console.log('[設定] 需要補建', assignmentsToFix.length, '個作業的提交記錄');

      if (assignmentsToFix.length > 0) {
        // 3.4 建立提交記錄
        const submissionsToCreate = assignmentsToFix.map(assignment => ({
          assignment_id: assignment.id,
          student_id: student.id,
          status: 'in_progress'  // 設定為進行中，學生立即可見
        }));

        const { data: createdSubmissions, error: insertError } = await supabase
          .from('assignment_submissions')
          .insert(submissionsToCreate)
          .select();

        if (insertError) {
          console.error('[設定] 建立提交記錄失敗:', insertError);
          throw new Error(`建立提交記錄失敗: ${insertError.message}`);
        }

        console.log('[設定] 成功建立', createdSubmissions?.length, '筆提交記錄');

        results.fixAssignments = {
          success: true,
          totalProjectAssignments: allProjectAssignments?.length || 0,
          existingSubmissions: existingSubmissions?.length || 0,
          fixedCount: createdSubmissions?.length || 0,
          fixedAssignments: assignmentsToFix.map(a => a.title)
        };
      } else {
        results.fixAssignments = {
          success: true,
          message: '所有專案作業都已有提交記錄，無需修復'
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ 設定完成！\n\n` +
               `1. 已將 ${studentEmail} 的名稱設定為「${fullName}」\n` +
               (fixAssignments && results.fixAssignments?.fixedCount > 0
                 ? `2. 已為 ${results.fixAssignments.fixedCount} 個專案作業補建提交記錄\n\n` +
                   `🎉 學生現在可以在前台看到這些作業了！`
                 : ''),
      data: results
    });

  } catch (error) {
    console.error('設定學生失敗:', error);
    return NextResponse.json({
      success: false,
      error: '設定失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
