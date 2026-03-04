import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import puppeteer from 'puppeteer';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * 生成完整的報告 PDF（用於 Email 附件）
 */
async function generateReportPDF(reportData: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    // 設定完整的 HTML 內容
    const htmlContent = generateFullReportHTML(reportData);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // 等待圖表渲染（使用 Promise + setTimeout）
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 生成 PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/**
 * 生成完整的獨立 HTML（使用 Chart.js 更穩定）
 */
function generateFullReportHTML(reportData: any): string {
  const { student, summary, details, date_range } = reportData;

  // 準備圖表資料
  const gradeChartData = (details.exams || [])
    .sort((a: any, b: any) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
    .map((exam: any, index: number) => ({
      name: `第${index + 1}次`,
      score: exam.percentage_score
    }));

  const vocabularyChartData = (details.vocabulary || [])
    .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .map((v: any) => {
      const correct = Math.round(v.words_learned * (v.accuracy_rate / 100));
      return {
        name: v.session_date.split('-').slice(1).join('/'),
        correct: correct,
        incorrect: v.words_learned - correct
      };
    });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: white;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #4F46E5; color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .section { background: white; border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 24px; border-radius: 12px; }
    .stats { display: flex; gap: 24px; margin-top: 16px; }
    .stat { text-align: center; flex: 1; }
    .stat-label { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #4F46E5; }
    h2 { margin-top: 0; color: #111827; }
    canvas { max-height: 300px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 36px;">學習報告</h1>
      <p style="margin: 8px 0 0 0; font-size: 18px;">學生：${student.name}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">統計期間：${date_range.start} 至 ${date_range.end}</p>
    </div>

    ${gradeChartData.length > 0 ? `
    <div class="section">
      <h2>📈 成績趨勢分析</h2>
      <canvas id="grade-chart"></canvas>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">平均分數</div>
          <div class="stat-value" style="color: #3b82f6;">${summary.exams.avg_score}</div>
        </div>
        <div class="stat">
          <div class="stat-label">最高分</div>
          <div class="stat-value" style="color: #10b981;">${summary.exams.highest_score}</div>
        </div>
        <div class="stat">
          <div class="stat-label">最低分</div>
          <div class="stat-value" style="color: #f59e0b;">${summary.exams.lowest_score}</div>
        </div>
      </div>
    </div>
    ` : ''}

    ${vocabularyChartData.length > 0 ? `
    <div class="section">
      <h2>📚 單字學習統計</h2>
      <canvas id="vocab-chart"></canvas>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">累積學習</div>
          <div class="stat-value" style="color: #8b5cf6;">${summary.vocabulary.total_words} 個</div>
        </div>
        <div class="stat">
          <div class="stat-label">平均正確率</div>
          <div class="stat-value" style="color: #10b981;">${summary.vocabulary.avg_accuracy}%</div>
        </div>
        <div class="stat">
          <div class="stat-label">學習次數</div>
          <div class="stat-value" style="color: #3b82f6;">${summary.vocabulary.sessions_count} 次</div>
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <script>
    ${gradeChartData.length > 0 ? `
    // 成績趨勢圖
    new Chart(document.getElementById('grade-chart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(gradeChartData.map((d: any) => d.name))},
        datasets: [{
          label: '分數',
          data: ${JSON.stringify(gradeChartData.map((d: any) => d.score))},
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { font: { size: 14 } }
          },
          x: {
            ticks: { font: { size: 14 } }
          }
        },
        plugins: {
          legend: { labels: { font: { size: 14 } } }
        }
      }
    });
    ` : ''}

    ${vocabularyChartData.length > 0 ? `
    // 單字學習圖
    new Chart(document.getElementById('vocab-chart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(vocabularyChartData.map((d: any) => d.name))},
        datasets: [
          {
            label: '答對單字',
            data: ${JSON.stringify(vocabularyChartData.map((d: any) => d.correct))},
            backgroundColor: '#10b981',
            stack: 'stack1'
          },
          {
            label: '答錯單字',
            data: ${JSON.stringify(vocabularyChartData.map((d: any) => d.incorrect))},
            backgroundColor: '#ef4444',
            stack: 'stack1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: {
            stacked: true,
            ticks: { font: { size: 14 } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { font: { size: 14 } }
          }
        },
        plugins: {
          legend: { labels: { font: { size: 14 } } }
        }
      }
    });
    ` : ''}
  </script>
</body>
</html>
  `;
}

/**
 * 生成 Email HTML 模板（簡潔版，提示查看 PDF 附件）
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
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin-bottom: 15px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">學習週報</h1>
      <p style="margin: 5px 0 0 0;">學生：${student.name}</p>
    </div>

    <div class="content">
      <div class="highlight">
        <p style="margin: 0; font-weight: bold;">📎 完整報告請查看附件 PDF</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">附件中包含詳細的圖表分析與學習數據</p>
      </div>

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
    const { student_id, recipients, report_data, pdf_attachment, report_image } = body;

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

    // 使用 Puppeteer 生成 PDF 附件
    console.log('使用 Puppeteer 生成報告 PDF...');
    const pdfBuffer = await generateReportPDF(report_data);

    // 生成 Email HTML（簡潔版，提示查看附件）
    const htmlContent = generateEmailHTML(report_data);

    // 準備 PDF 附件
    const attachments = [{
      filename: `學習報告_${student.name}_${new Date().toISOString().split('T')[0]}.pdf`,
      content: pdfBuffer
    }];

    // 發送郵件
    const emailPromises = emailList.map(email =>
      getResend().emails.send({
        from: 'iLearn 學習管理系統 <onboarding@resend.dev>', // 開發環境用的預設寄件者
        to: email,
        subject: `【學習週報】${student.name} - ${new Date().toLocaleDateString('zh-TW')}`,
        html: htmlContent,
        attachments: attachments
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
