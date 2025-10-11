import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 生成 Email HTML 模板
 */
function generateEmailHTML(reportData: any): string {
  const { student, summary, date_range } = reportData;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { background: white; padding: 15px; margin-bottom: 15px; border-radius: 6px; }
    .stat { display: inline-block; margin: 10px 15px 10px 0; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .stat-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">學習週報</h1>
      <p style="margin: 5px 0 0 0;">學生：${student.name}</p>
    </div>

    <div class="content">
      <div class="section">
        <h2 style="margin-top: 0;">📊 學習摘要</h2>
        <p>統計期間：${date_range.start} 至 ${date_range.end}</p>
      </div>

      <div class="section">
        <h3>📚 單字學習</h3>
        <div class="stat">
          <div class="stat-label">學習單字數</div>
          <div class="stat-value">${summary.vocabulary.total_words}</div>
        </div>
        <div class="stat">
          <div class="stat-label">平均正確率</div>
          <div class="stat-value">${summary.vocabulary.avg_accuracy}%</div>
        </div>
        <div class="stat">
          <div class="stat-label">學習次數</div>
          <div class="stat-value">${summary.vocabulary.sessions_count}</div>
        </div>
      </div>

      <div class="section">
        <h3>📝 考試成績</h3>
        <div class="stat">
          <div class="stat-label">考試次數</div>
          <div class="stat-value">${summary.exams.total_exams}</div>
        </div>
        <div class="stat">
          <div class="stat-label">平均分數</div>
          <div class="stat-value">${summary.exams.avg_score}</div>
        </div>
        ${summary.exams.total_exams > 0 ? `
        <div class="stat">
          <div class="stat-label">最高分</div>
          <div class="stat-value">${summary.exams.highest_score}</div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <h3>✅ 作業完成</h3>
        <div class="stat">
          <div class="stat-label">完成數量</div>
          <div class="stat-value">${summary.assignments.completed}/${summary.assignments.total_assignments}</div>
        </div>
        <div class="stat">
          <div class="stat-label">完成率</div>
          <div class="stat-value">${summary.assignments.completion_rate}%</div>
        </div>
        ${summary.assignments.avg_score > 0 ? `
        <div class="stat">
          <div class="stat-label">平均分數</div>
          <div class="stat-value">${summary.assignments.avg_score}</div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <h3>💡 學習建議</h3>
        <ul>
          ${summary.vocabulary.avg_accuracy < 70
            ? '<li>建議增加單字練習時間，提升學習正確率</li>'
            : '<li>單字學習表現良好！繼續保持</li>'}
          ${summary.assignments.completion_rate < 80
            ? '<li>建議督促按時完成作業</li>'
            : '<li>作業完成率優秀！</li>'}
          ${summary.exams.avg_score < 75 && summary.exams.total_exams > 0
            ? '<li>建議加強考試準備，複習重點內容</li>'
            : summary.exams.total_exams > 0 ? '<li>考試表現良好！</li>' : ''}
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>此郵件由系統自動發送，請勿直接回覆</p>
      <p>© ${new Date().getFullYear()} iLearn 學習管理系統</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * POST /api/admin/send-report-email
 * 寄送學習報告 Email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, recipients, report_data, pdf_attachment } = body;

    if (!student_id || !recipients || !report_data) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const { student } = report_data;

    // 建立收件人列表
    const emailList: string[] = [];

    if (recipients.includes('parent') && student.parent?.email) {
      emailList.push(student.parent.email);
    }

    if (recipients.includes('student') && student.email) {
      emailList.push(student.email);
    }

    if (emailList.length === 0) {
      return NextResponse.json(
        { success: false, error: '沒有有效的收件人 Email' },
        { status: 400 }
      );
    }

    // 生成 Email HTML
    const htmlContent = generateEmailHTML(report_data);

    // 準備附件（如果有 PDF）
    const attachments = pdf_attachment ? [{
      filename: `學習報告_${student.name}_${new Date().toISOString().split('T')[0]}.pdf`,
      content: pdf_attachment // Base64 編碼的 PDF
    }] : [];

    // 發送郵件
    const emailPromises = emailList.map(email =>
      resend.emails.send({
        from: 'iLearn 學習管理系統 <onboarding@resend.dev>', // 開發環境用的預設寄件者
        to: email,
        subject: `【學習週報】${student.name} - ${new Date().toLocaleDateString('zh-TW')}`,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined
      })
    );

    const results = await Promise.allSettled(emailPromises);

    // 檢查結果
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      console.error('部分郵件發送失敗:', results.filter(r => r.status === 'rejected'));
    }

    return NextResponse.json({
      success: successful > 0,
      message: `成功發送 ${successful} 封郵件${failed > 0 ? `，${failed} 封失敗` : ''}`,
      data: {
        sent_to: emailList,
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('發送報告郵件時發生錯誤:', error);
    return NextResponse.json(
      { success: false, error: '發送郵件失敗' },
      { status: 500 }
    );
  }
}
