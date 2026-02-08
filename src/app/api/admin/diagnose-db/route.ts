import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { isAdmin } from '@/lib/security-config';

/**
 * 診斷 API - 檢查資料庫表和權限
 * GET /api/admin/diagnose-db
 */
export async function GET(request: NextRequest) {
  try {
    const { user: authUser } = await authenticateRequest(request);
    if (!authUser || !isAdmin(authUser)) {
      return NextResponse.json(
        { success: false, error: '需要管理員權限' },
        { status: authUser ? 403 : 401 }
      );
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    const supabase = createSupabaseAdminClient();

    // 1. 檢查 student_tasks 表是否存在
    console.log('[Diagnose] 檢查 student_tasks 表...');
    try {
      const { data, error } = await supabase
        .from('student_tasks')
        .select('id')
        .limit(1);

      if (error) {
        results.checks.push({
          name: 'student_tasks 表存在性',
          status: 'error',
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          }
        });
      } else {
        results.checks.push({
          name: 'student_tasks 表存在性',
          status: 'success',
          message: '表存在且可查詢',
          recordCount: data?.length || 0
        });
      }
    } catch (err: any) {
      results.checks.push({
        name: 'student_tasks 表存在性',
        status: 'exception',
        error: err.message
      });
    }

    // 2. 檢查 course_requests 表和已批准的學生
    console.log('[Diagnose] 檢查已批准的學生...');
    try {
      const { data: students, error } = await supabase
        .from('course_requests')
        .select('user_id, user_info, status')
        .eq('status', 'approved')
        .limit(5);

      if (error) {
        results.checks.push({
          name: '已批准學生列表',
          status: 'error',
          error: {
            code: error.code,
            message: error.message
          }
        });
      } else {
        results.checks.push({
          name: '已批准學生列表',
          status: 'success',
          count: students?.length || 0,
          students: students?.map(s => ({
            id: s.user_id,
            name: s.user_info?.name || 'Unknown'
          }))
        });
      }
    } catch (err: any) {
      results.checks.push({
        name: '已批准學生列表',
        status: 'exception',
        error: err.message
      });
    }

    // 3. 測試插入權限（使用假的 UUID）
    console.log('[Diagnose] 測試插入權限...');
    try {
      const testData = {
        student_id: '00000000-0000-0000-0000-000000000000',
        task_description: 'TEST - 診斷用測試記錄',
        task_type: 'onetime',
        due_date: '2099-12-31',
        priority: 'low'
      };

      const { data, error } = await supabase
        .from('student_tasks')
        .insert([testData])
        .select()
        .single();

      if (error) {
        // 外鍵錯誤是預期的（因為使用了假 UUID）
        if (error.code === '23503') {
          results.checks.push({
            name: '插入權限測試',
            status: 'success',
            message: '權限正常（外鍵錯誤是預期的）',
            errorCode: error.code
          });
        } else {
          results.checks.push({
            name: '插入權限測試',
            status: 'error',
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            }
          });
        }
      } else {
        // 成功插入，清理測試記錄
        await supabase.from('student_tasks').delete().eq('id', data.id);
        results.checks.push({
          name: '插入權限測試',
          status: 'success',
          message: '成功插入並清理測試記錄'
        });
      }
    } catch (err: any) {
      results.checks.push({
        name: '插入權限測試',
        status: 'exception',
        error: err.message
      });
    }

    // 4. 檢查環境變數
    results.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    };

    // 5. 總結
    const allSuccess = results.checks.every((c: any) => c.status === 'success');
    results.summary = {
      allChecksPass: allSuccess,
      totalChecks: results.checks.length,
      successCount: results.checks.filter((c: any) => c.status === 'success').length,
      errorCount: results.checks.filter((c: any) => c.status === 'error').length,
      exceptionCount: results.checks.filter((c: any) => c.status === 'exception').length
    };

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    console.error('[Diagnose] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Diagnostic check failed',
        details: {
          message: error?.message,
          stack: error?.stack
        }
      },
      { status: 500 }
    );
  }
}
