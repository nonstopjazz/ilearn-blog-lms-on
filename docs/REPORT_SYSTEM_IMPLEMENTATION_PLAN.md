# 學習報表系統 - 完整實作方案

## 📊 現況分析

### 學生資料來源
- **資料表：** `course_requests`
- **目前有4位學生**（已批准的課程申請）
- **資料結構：**
  ```json
  {
    "user_id": "UUID",
    "user_info": {
      "name": "學生姓名",
      "email": "學生Email"
    }
  }
  ```

### 問題：家長資訊目前不存在
- `user_info` 只有學生的 name 和 email
- 沒有家長的姓名、Email、電話等資訊

---

## 💡 解決方案：擴充 user_info 欄位

### 方案：在 `course_requests` 的 `user_info` 加入家長資訊

#### 1. 資料結構設計（JSONB 格式）

```json
{
  "user_info": {
    "name": "許庭睿",
    "email": "1121b005@yuteh.ntpc.edu.tw",
    "phone": "0912345678",
    "parent": {
      "name": "許爸爸",
      "email": "parent@example.com",
      "phone": "0987654321",
      "relationship": "父親"
    },
    "report_settings": {
      "schedule_enabled": true,
      "send_day": "friday",
      "send_time": "18:00",
      "recipients": ["parent", "student"],
      "timezone": "Asia/Taipei"
    }
  }
}
```

#### 2. 優點
✅ 不需要建立新表
✅ JSONB 格式靈活，可隨時擴充
✅ 與現有架構相容
✅ 每個學生可以有獨立的設定

#### 3. Migration SQL

```sql
-- 不需要修改表結構，只需要更新資料
-- 範例：為特定學生新增家長資訊
UPDATE course_requests
SET user_info = jsonb_set(
  user_info,
  '{parent}',
  '{"name": "家長姓名", "email": "parent@example.com", "phone": "0912345678", "relationship": "父親"}'::jsonb
)
WHERE user_id = '學生UUID';

-- 新增報表設定
UPDATE course_requests
SET user_info = jsonb_set(
  user_info,
  '{report_settings}',
  '{"schedule_enabled": true, "send_day": "friday", "send_time": "18:00", "recipients": ["parent", "student"], "timezone": "Asia/Taipei"}'::jsonb
)
WHERE user_id = '學生UUID';
```

---

## 🗓️ 報表排程機制

### 需求
1. ✅ 每週固定時間自動發送（預設週五）
2. ✅ 每個學生可以設定不同的發送時間
3. ✅ 管理員可手動即時發送
4. ✅ 學生也可以手動發送（自己查看）

### 實作方案

#### 1. 使用 Vercel Cron Jobs
- 每小時執行一次檢查
- 檢查哪些學生該發送報告了

#### 2. 資料庫增加排程記錄表

```sql
CREATE TABLE IF NOT EXISTS report_schedules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id UUID NOT NULL,
    schedule_type VARCHAR(50) DEFAULT 'weekly', -- weekly, monthly, custom
    send_day VARCHAR(20), -- monday, tuesday, ..., sunday
    send_time TIME, -- 18:00
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    recipients JSONB, -- ["parent", "student"] or ["parent_email@example.com"]
    is_enabled BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    next_send_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Cron Job 設定

**`vercel.json`:**
```json
{
  "crons": [{
    "path": "/api/cron/send-weekly-reports",
    "schedule": "0 * * * *"
  }]
}
```

**`/api/cron/send-weekly-reports/route.ts`:**
```typescript
export async function GET(request: NextRequest) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });

  // 查詢所有該發送的排程
  const { data: schedules } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('is_enabled', true)
    .eq('send_day', currentDay);

  for (const schedule of schedules) {
    const sendHour = parseInt(schedule.send_time.split(':')[0]);

    // 如果當前小時匹配
    if (sendHour === currentHour) {
      // 生成並發送報告
      await generateAndSendReport(schedule.student_id, schedule.recipients);

      // 更新下次發送時間
      await updateNextSendTime(schedule.id);
    }
  }

  return NextResponse.json({ success: true });
}
```

---

## 🎨 前端介面設計

### 1. `/admin/learning-management` 頁面擴充

#### 學生列表增加操作按鈕：

```tsx
<div className="flex gap-2">
  {/* 查看報告 */}
  <Button onClick={() => handleViewReport(student)}>
    <Eye className="w-4 h-4 mr-1" />
    查看報告
  </Button>

  {/* 下載 PDF */}
  <Button variant="outline" onClick={() => handleDownloadPDF(student)}>
    <Download className="w-4 h-4 mr-1" />
    下載 PDF
  </Button>

  {/* 寄送報告 */}
  <Button variant="outline" onClick={() => handleSendReport(student)}>
    <Mail className="w-4 h-4 mr-1" />
    寄送報告
  </Button>

  {/* 排程設定 */}
  <Button variant="ghost" onClick={() => handleScheduleSettings(student)}>
    <Settings className="w-4 h-4" />
  </Button>
</div>
```

#### 新增「寄送報告」對話框：

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>寄送學習報告 - {student.name}</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* 收件人選擇 */}
      <div>
        <Label>收件人</Label>
        <div className="space-y-2">
          <Checkbox checked={sendToParent}>寄給家長 ({parentEmail})</Checkbox>
          <Checkbox checked={sendToStudent}>寄給學生 ({studentEmail})</Checkbox>
        </div>
      </div>

      {/* 報表類型 */}
      <Select value={reportType}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="weekly">本週報告</SelectItem>
          <SelectItem value="monthly">本月報告</SelectItem>
          <SelectItem value="custom">自訂範圍</SelectItem>
        </SelectContent>
      </Select>

      {/* 如果選擇自訂範圍 */}
      {reportType === 'custom' && (
        <DateRangePicker />
      )}
    </div>

    <DialogFooter>
      <Button onClick={handleSend}>
        <Mail className="w-4 h-4 mr-2" />
        立即寄送
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 新增「排程設定」對話框：

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>報表排程設定 - {student.name}</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* 啟用排程 */}
      <Switch checked={scheduleEnabled}>
        啟用自動發送
      </Switch>

      {/* 發送日期 */}
      <Select value={sendDay}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monday">每週一</SelectItem>
          <SelectItem value="friday">每週五</SelectItem>
          <SelectItem value="sunday">每週日</SelectItem>
        </SelectContent>
      </Select>

      {/* 發送時間 */}
      <Input type="time" value={sendTime} />

      {/* 收件人設定 */}
      <div>
        <Label>預設收件人</Label>
        <Checkbox>家長</Checkbox>
        <Checkbox>學生</Checkbox>
      </div>
    </div>

    <DialogFooter>
      <Button onClick={handleSaveSchedule}>儲存設定</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2. 報表預覽視窗

```tsx
<Dialog fullWidth maxWidth="lg">
  <DialogContent>
    {/* 複用 /learning 的總覽 UI */}
    <div ref={reportRef} className="p-8 bg-white">
      <LearningOverview
        studentData={reportData}
        readOnly={true}
      />
    </div>

    <DialogActions>
      <Button onClick={() => downloadPDF(reportRef)}>
        下載 PDF
      </Button>
      <Button onClick={() => sendEmail(reportRef)}>
        寄送 Email
      </Button>
    </DialogActions>
  </DialogContent>
</Dialog>
```

---

## 🔧 後端 API 實作

### 1. `/api/admin/students/[id]/learning-data`
**功能：** 取得單一學生的完整學習資料

```typescript
export async function GET(request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const dateRange = searchParams.get('range') || 'week';

  // 計算日期範圍
  const { startDate, endDate } = calculateDateRange(dateRange);

  // 並行查詢所有資料
  const [vocabulary, exams, assignments, progress] = await Promise.all([
    getVocabularyData(id, startDate, endDate),
    getExamData(id, startDate, endDate),
    getAssignmentData(id, startDate, endDate),
    getProgressData(id, startDate, endDate)
  ]);

  return NextResponse.json({
    success: true,
    data: {
      student_id: id,
      date_range: { start: startDate, end: endDate },
      vocabulary,
      exams,
      assignments,
      progress
    }
  });
}
```

### 2. `/api/admin/generate-report`
**功能：** 生成 PDF 報告

```typescript
import { renderToString } from 'react-dom/server';
import puppeteer from 'puppeteer';

export async function POST(request) {
  const { student_id, report_type, date_range } = await request.json();

  // 取得學生資料
  const learningData = await fetchLearningData(student_id, date_range);

  // 渲染 HTML
  const html = renderToString(
    <LearningOverviewReport data={learningData} />
  );

  // 生成 PDF (使用 puppeteer 或其他方案)
  const pdfBuffer = await generatePDF(html);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report_${student_id}.pdf"`
    }
  });
}
```

### 3. `/api/admin/send-report-email`
**功能：** 寄送報告 Email

```typescript
import { Resend } from 'resend';

export async function POST(request) {
  const { student_id, recipients, report_data } = await request.json();

  const resend = new Resend(process.env.RESEND_API_KEY);

  // 生成 PDF
  const pdfBuffer = await generatePDF(report_data);

  // 取得學生資訊
  const student = await getStudentInfo(student_id);

  // 發送郵件
  const emails = [];
  if (recipients.includes('parent') && student.parent?.email) {
    emails.push(student.parent.email);
  }
  if (recipients.includes('student') && student.email) {
    emails.push(student.email);
  }

  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: emails,
    subject: `學習週報 - ${student.name}`,
    html: generateEmailHTML(report_data),
    attachments: [{
      filename: `學習報告_${student.name}.pdf`,
      content: pdfBuffer
    }]
  });

  return NextResponse.json({ success: true });
}
```

---

## 📋 實作步驟建議

### 階段 1：資料結構準備（0.5天）
1. ✅ 為 4 位學生新增家長資訊到 `user_info`
2. ✅ 建立 `report_schedules` 表
3. ✅ 新增管理介面讓admin可以編輯家長資訊

### 階段 2：API 開發（1-1.5天）
4. ✅ 實作 `/api/admin/students/[id]/learning-data`
5. ✅ 實作 `/api/admin/generate-report`
6. ✅ 實作 `/api/admin/send-report-email`

### 階段 3：前端功能（1-1.5天）
7. ✅ `/admin/learning-management` 加入操作按鈕
8. ✅ 實作報表預覽視窗
9. ✅ 實作寄送報告對話框
10. ✅ 實作排程設定對話框

### 階段 4：PDF 生成（1天）
11. ✅ 選擇 PDF 生成方案（react-to-pdf vs puppeteer）
12. ✅ 實作 PDF 生成邏輯
13. ✅ 優化 PDF 樣式

### 階段 5：排程系統（1天）
14. ✅ 設定 Vercel Cron Job
15. ✅ 實作排程檢查邏輯
16. ✅ 測試自動發送

### 階段 6：整合測試（0.5天）
17. ✅ 測試手動發送
18. ✅ 測試自動排程
19. ✅ 測試批量發送

**總計：約 5-6 天**

---

## 🎯 我的建議：分三階段實作

### 第一階段：基礎功能（優先）
- 新增家長資訊欄位
- 實作手動發送功能（立即可用）
- 實作 PDF 生成

### 第二階段：進階功能
- 實作自動排程
- 批量發送

### 第三階段：優化
- 報表模板自訂
- 資料視覺化優化

---

## ❓ 待確認問題

1. **您同意使用 `user_info` JSONB 欄位存放家長資訊嗎？**
   - ✅ 同意
   - ❌ 不同意，想建立獨立的 parents 表

2. **PDF 生成方案：**
   - A. react-to-pdf（簡單，但PDF是圖片）
   - B. puppeteer（專業，真正的PDF，但需要更多設定）
   - C. @react-pdf/renderer（最專業，但實作時間長）

3. **Email 模板：**
   - 簡單文字 + PDF 附件
   - 精美 HTML Email + PDF 附件

4. **優先實作哪個階段？**
   - 第一階段（基礎功能）
   - 一起做（全部功能）

請告訴我您的決定，我就開始實作！😊
