import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/admin/generate-report
 * 生成學習報告（返回 HTML 或資料，由前端使用 react-to-pdf 轉換）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, report_type = 'weekly', date_range } = body;

    if (!student_id) {
      return NextResponse.json(
        { success: false, error: '缺少學生 ID' },
        { status: 400 }
      );
    }

    // 1. 取得學生完整學習資料
    let apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/students/${student_id}/learning-data`;

    // 添加日期範圍參數
    if (date_range?.start && date_range?.end) {
      apiUrl += `?start=${date_range.start}&end=${date_range.end}`;
    } else {
      // 根據報告類型設定範圍
      const rangeMap: { [key: string]: string } = {
        'weekly': 'week',
        'monthly': 'month',
        'quarterly': 'quarter',
        'yearly': 'year',
        'all': 'all'
      };
      apiUrl += `?range=${rangeMap[report_type] || 'week'}`;
    }

    const response = await fetch(apiUrl);
    const learningData = await response.json();

    if (!learningData.success) {
      return NextResponse.json(
        { success: false, error: '無法取得學生學習資料' },
        { status: 500 }
      );
    }

    // 2. 生成報告內容
    const reportData = {
      ...learningData.data,
      report_metadata: {
        report_type,
        generated_at: new Date().toISOString(),
        generated_by: 'admin'
      }
    };

    // 3. 返回報告資料（前端會用 react-to-pdf 生成 PDF）
    return NextResponse.json({
      success: true,
      data: reportData,
      message: '報告資料已準備完成'
    });

  } catch (error) {
    console.error('生成報告時發生錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
