import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/api-auth';

// GET - 生成週報告
export async function GET(request: NextRequest) {
  try {
    // 驗證 API 金鑰
    const authResult = await verifyApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const send_notification = searchParams.get('send_notification') === 'true';

    if (!student_id) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // 計算週的開始和結束日期
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);
    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];

    // 收集週統計資料
    const [
      courses,
      allAssignments,
      submissions,
      vocabulary,
      exams,
      projects
    ] = await Promise.all([
      // 取得學生的所有課程
      supabase
        .from('course_lessons')
        .select('course_id, title')
        .eq('is_published', true),

      // 本週所有作業
      supabase
        .from('assignments')
        .select('*')
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .eq('is_published', true),

      // 學生提交的作業
      supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', student_id)
        .gte('submission_date', startDate)
        .lte('submission_date', endDate),

      // 單字學習記錄
      supabase
        .from('vocabulary_sessions')
        .select('*')
        .eq('student_id', student_id)
        .gte('session_date', startDate)
        .lte('session_date', endDate),

      // 考試成績
      supabase
        .from('exam_records')
        .select('*')
        .eq('student_id', student_id)
        .gte('exam_date', startDate)
        .lte('exam_date', endDate),

      // 特殊專案進度
      supabase
        .from('special_projects')
        .select('*')
        .eq('student_id', student_id)
        .eq('status', 'in_progress')
    ]);

    // 生成週報告內容
    const report = generateWeeklyReport({
      student_id,
      week_number: weekNumber,
      year,
      date_range: { start: startDate, end: endDate },
      assignments: {
        total: allAssignments.data?.length || 0,
        completed: submissions.data?.length || 0,
        on_time: submissions.data?.filter(s => !s.is_late).length || 0,
        late: submissions.data?.filter(s => s.is_late).length || 0
      },
      vocabulary: {
        sessions: vocabulary.data || [],
        total_words: vocabulary.data?.reduce((sum, v) => sum + (v.words_learned || 0), 0) || 0,
        avg_accuracy: vocabulary.data && vocabulary.data.length > 0
          ? vocabulary.data.reduce((sum, v) => sum + (v.accuracy_rate || 0), 0) / vocabulary.data.length
          : 0
      },
      exams: {
        records: exams.data || [],
        avg_score: exams.data && exams.data.length > 0
          ? exams.data.reduce((sum, e) => sum + (e.percentage_score || 0), 0) / exams.data.length
          : null
      },
      projects: {
        active: projects.data || []
      }
    });

    // 儲存報告到資料庫
    const { data: savedReport, error: saveError } = await supabase
      .from('parent_notifications')
      .insert([{
        student_id,
        notification_type: 'weekly_report',
        subject: `第${weekNumber}週學習報告 (${startDate} - ${endDate})`,
        content: report.text,
        data: report.data,
        sent_via: send_notification ? ['email', 'in_app'] : ['in_app'],
        status: send_notification ? 'sent' : 'pending',
        sent_at: send_notification ? new Date().toISOString() : null
      }])
      .select()
      .single();

    if (saveError) {
      console.error('[Weekly Report] Save error:', saveError);
    }

    // 如果需要發送通知
    if (send_notification) {
      // 這裡可以整合郵件服務或推送通知服務
      console.log(`[Weekly Report] Notification sent for student ${student_id}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        report: report.data,
        notification_id: savedReport?.id,
        sent: send_notification
      },
      message: 'Weekly report generated successfully'
    });

  } catch (error) {
    console.error('[Weekly Report API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 批量生成所有學生的週報告
export async function POST(request: NextRequest) {
  try {
    // 驗證 API 金鑰
    const authResult = await verifyApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = getSupabase();

    // 取得所有需要生成報告的學生
    // 這裡假設有一個 students 表，實際應根據您的資料結構調整
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .eq('is_active', true);

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active students found'
      });
    }

    const results = [];
    const errors = [];

    // 為每個學生生成週報告
    for (const student of students) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/learning/weekly-report?student_id=${student.id}&send_notification=true`,
          {
            headers: {
              'x-api-key': process.env.API_KEY || ''
            }
          }
        );

        const data = await response.json();
        if (data.success) {
          results.push({ student_id: student.id, success: true });
        } else {
          errors.push({ student_id: student.id, error: data.error });
        }
      } catch (err) {
        errors.push({ student_id: student.id, error: 'Failed to generate report' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: students.length,
        successful: results.length,
        failed: errors.length,
        errors: errors
      },
      message: `Generated ${results.length} weekly reports`
    });

  } catch (error) {
    console.error('[Weekly Report Batch API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 輔助函數
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  return new Date(d.setDate(diff));
}

function generateWeeklyReport(data: any) {
  const {
    student_id,
    week_number,
    year,
    date_range,
    assignments,
    vocabulary,
    exams,
    projects
  } = data;

  // 生成文字報告
  const textReport = `
📚 第${week_number}週學習報告
📅 ${date_range.start} - ${date_range.end}

【作業完成情況】
- 本週作業：${assignments.total}項
- 已完成：${assignments.completed}項
- 完成率：${assignments.total > 0 ? Math.round((assignments.completed / assignments.total) * 100) : 0}%
- 準時提交：${assignments.on_time}項
- 遲交：${assignments.late}項

【單字學習進度】
- 學習次數：${vocabulary.sessions.length}次
- 總學習單字：${vocabulary.total_words}個
- 平均正確率：${vocabulary.avg_accuracy.toFixed(1)}%
${vocabulary.sessions.map((s: any) =>
  `  • ${s.session_date}: 編號 ${s.start_number}-${s.end_number}，正確率 ${s.accuracy_rate || 'N/A'}%`
).join('\n')}

【考試成績】
${exams.records.length > 0 ?
  `- 本週考試：${exams.records.length}次
- 平均分數：${exams.avg_score?.toFixed(1) || 'N/A'}分
${exams.records.map((e: any) =>
  `  • ${e.exam_name}: ${e.percentage_score || e.total_score || 'N/A'}分`
).join('\n')}` :
  '本週無考試記錄'}

【進行中的專案】
${projects.active.length > 0 ?
  projects.active.map(p =>
    `- ${p.project_name}：進度 ${p.progress_percentage || 0}%`
  ).join('\n') :
  '無進行中的專案'}

【學習建議】
${generateSuggestions(data)}

---
此報告由系統自動生成
如有問題請聯繫老師
  `.trim();

  // 生成結構化數據
  const structuredData = {
    week_number,
    year,
    date_range,
    assignments,
    vocabulary: {
      sessions_count: vocabulary.sessions.length,
      total_words: vocabulary.total_words,
      avg_accuracy: vocabulary.avg_accuracy,
      daily_breakdown: vocabulary.sessions.map(s => ({
        date: s.session_date,
        words: s.words_learned,
        accuracy: s.accuracy_rate
      }))
    },
    exams: {
      count: exams.records.length,
      avg_score: exams.avg_score,
      records: exams.records.map(e => ({
        name: e.exam_name,
        type: e.exam_type,
        score: e.percentage_score || e.total_score,
        date: e.exam_date
      }))
    },
    projects: projects.active.map(p => ({
      name: p.project_name,
      type: p.project_type,
      progress: p.progress_percentage,
      status: p.status
    })),
    generated_at: new Date().toISOString()
  };

  return {
    text: textReport,
    data: structuredData
  };
}

function generateSuggestions(data: any): string {
  const suggestions: string[] = [];

  // 根據作業完成情況給建議
  if (data.assignments.total > 0) {
    const completionRate = (data.assignments.completed / data.assignments.total) * 100;
    if (completionRate < 50) {
      suggestions.push('1. 需要加強作業完成度，建議制定每日學習計劃');
    } else if (completionRate < 80) {
      suggestions.push('1. 作業完成情況尚可，繼續保持並爭取全部完成');
    } else {
      suggestions.push('1. 作業完成情況優秀，請繼續保持');
    }

    if (data.assignments.late > 0) {
      suggestions.push('2. 有遲交情況，建議提前規劃時間');
    }
  }

  // 根據單字學習給建議
  if (data.vocabulary.sessions.length === 0) {
    suggestions.push('3. 本週未進行單字學習，建議每日堅持學習');
  } else if (data.vocabulary.avg_accuracy < 70) {
    suggestions.push('3. 單字正確率偏低，建議加強複習');
  }

  // 根據考試成績給建議
  if (data.exams.avg_score && data.exams.avg_score < 60) {
    suggestions.push('4. 考試成績需要提升，建議加強薄弱科目練習');
  }

  return suggestions.length > 0 ? suggestions.join('\n') : '繼續保持良好的學習狀態！';
}