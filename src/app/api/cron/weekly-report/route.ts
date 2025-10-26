import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// 這個 API 路由可以由 Vercel Cron Jobs 或其他排程服務調用
// 配置在 vercel.json 中設定每週執行

export async function GET(request: NextRequest) {
  try {
    // 驗證請求來源（用於 Vercel Cron）
    const authHeader = (await headers()).get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 檢查是否為週日（或您希望發送報告的日子）
    const now = new Date();
    const dayOfWeek = now.getDay();

    // 0 = 週日, 1 = 週一, 等等
    // 這裡設定為週日晚上生成報告
    if (dayOfWeek !== 0 && !request.nextUrl.searchParams.get('force')) {
      return NextResponse.json({
        success: true,
        message: 'Not scheduled day for weekly reports',
        next_run: getNextSunday()
      });
    }

    // 調用批量生成週報告的 API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/learning/weekly-report`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY || ''
        },
        body: JSON.stringify({
          send_notifications: true,
          include_inactive: false
        })
      }
    );

    const result = await response.json();

    // 記錄執行結果
    console.log('[Cron Job] Weekly report generation completed:', {
      timestamp: now.toISOString(),
      success: result.success,
      reports_generated: result.data?.successful || 0,
      errors: result.data?.failed || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Weekly reports generated successfully',
      timestamp: now.toISOString(),
      results: result.data,
      next_run: getNextSunday()
    });

  } catch (error) {
    console.error('[Cron Job] Error generating weekly reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate weekly reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 取得下一個週日的日期
function getNextSunday(): string {
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  nextSunday.setHours(20, 0, 0, 0); // 設定為晚上 8 點
  return nextSunday.toISOString();
}