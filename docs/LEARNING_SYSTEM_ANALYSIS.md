# 學習管理系統 - 架構分析報告

## 📊 一、資料庫結構分析

### 1.1 核心資料表

#### **vocabulary_sessions** (單字學習追蹤表)
- `student_id`: 學生 ID
- `course_id`: 課程 ID
- `session_date`: 學習日期
- `start_number` / `end_number`: 累積編號範圍
- `words_learned`: 學習單字數（自動計算）
- `accuracy_rate`: 正確率
- `session_duration`: 學習時長（分鐘）

#### **exam_records** (考試成績管理表)
- `student_id`: 學生 ID
- `course_id`: 課程 ID
- `exam_type`: 考試類型（quiz, midterm, final）
- `exam_name`: 考試名稱
- `exam_date`: 考試日期
- `total_score` / `max_score`: 分數
- `percentage_score`: 百分比（自動計算）
- `teacher_feedback`: 老師回饋

#### **assignment_submissions** (作業提交記錄表)
- `assignment_id`: 作業 ID
- `student_id`: 學生 ID
- `submission_date`: 提交日期
- `status`: 狀態（submitted, graded, returned）
- `score` / `max_score`: 分數
- `is_late`: 是否遲交

#### **learning_progress_stats** (學習進度統計表)
- `student_id`: 學生 ID
- `course_id`: 課程 ID
- `week_number` / `year`: 週次 / 年份
- `assignments_completed` / `assignments_total`: 作業完成數
- `vocabulary_words_learned`: 單字學習數
- `vocabulary_accuracy`: 單字正確率
- `quiz_average`: 測驗平均分數

#### **parent_notifications** (家長通知記錄表)
- `student_id`: 學生 ID
- `notification_type`: 通知類型（weekly_report, exam_result）
- `subject`: 主旨
- `content`: 內容
- `data`: JSONB 格式的詳細數據
- `sent_via`: 發送方式（email, sms, in_app）
- `status`: 狀態（pending, sent, failed）

---

## 🔌 二、現有 API 架構

### 2.1 已實作的 API

#### `/api/learning/weekly-report`
**功能：** 生成學習週報

**GET 參數：**
- `student_id`: 學生 ID
- `send_notification`: 是否發送通知

**返回數據：**
```json
{
  "success": true,
  "data": {
    "report": {
      "week_number": 5,
      "year": 2025,
      "assignments": { "total": 10, "completed": 8 },
      "vocabulary": { "total_words": 50, "avg_accuracy": 85 },
      "exams": { "count": 2, "avg_score": 88 }
    }
  }
}
```

**POST 功能：** 批量生成所有學生的週報

#### `/api/learning/exams`
**功能：** 考試成績管理（推測，需確認）

#### `/api/learning/vocabulary`
**功能：** 單字學習管理（推測，需確認）

#### `/api/learning/progress`
**功能：** 學習進度管理（推測，需確認）

---

## 🎨 三、前端頁面分析

### 3.1 `/learning` 頁面（學生端）

**目前狀況：**
- ✅ UI 已完成（總覽、作業管理、成績管理等頁籤）
- ❌ **使用模擬資料**，未連接資料庫
- ❌ 未整合登入使用者資訊

**資料來源：**
```typescript
// 硬編碼的模擬資料
const allGradeData = [ /* 假資料 */ ];
const allVocabularyData = [ /* 假資料 */ ];
const assignmentsByWeek = [ /* 假資料 */ ];
```

**缺少的功能：**
1. 從 API 取得真實資料
2. 根據登入學生 ID 過濾資料
3. 即時更新資料

### 3.2 `/admin/learning-management` 頁面（管理員端）

**目前狀況：**
- ✅ 有學生列表
- ✅ 有「報告生成」相關 state
- ❌ 報告生成功能未完成

**現有功能：**
```typescript
const [isGeneratingReport, setIsGeneratingReport] = useState(false);
const [reportStudent, setReportStudent] = useState<Student | null>(null);
```

---

## 🔗 四、前後端整合缺口

### 4.1 `/learning` 頁面需要連接的 API

| 頁籤 | 需要的資料 | 對應的資料表 | 需要的 API |
|------|-----------|------------|-----------|
| 總覽 - 統計卡片 | 本週作業數、完成率 | `assignment_submissions` | `/api/learning/stats` |
| 總覽 - 成績趨勢 | 考試成績歷史 | `exam_records` | `/api/learning/exams` |
| 總覽 - 單字學習 | 單字學習記錄 | `vocabulary_sessions` | `/api/learning/vocabulary` |
| 總覽 - 作業追蹤 | 作業完成狀況 | `assignments` + `assignment_submissions` | `/api/learning/assignments` |
| 成績管理 | 考試記錄列表 | `exam_records` | `/api/learning/exams` |
| 單字學習 | 單字學習記錄 | `vocabulary_sessions` | `/api/learning/vocabulary` |

### 4.2 缺少的 API

1. **`/api/learning/stats`** - 取得學生的學習統計
2. **`/api/learning/assignments`** - 取得作業資料（含提交狀況）
3. **`/api/admin/students/[id]/learning-data`** - 管理員查看單一學生完整資料

---

## 📋 五、匯出 PDF + Email 功能規劃

### 5.1 資料流程

```
1. 管理員在 /admin/learning-management 選擇學生
   ↓
2. 點擊「查看/匯出報告」
   ↓
3. 系統呼叫 API 取得該學生的學習資料
   ↓
4. 使用 /learning 的 UI 組件渲染報告
   ↓
5. 使用 react-to-pdf 轉換為 PDF
   ↓
6. 透過 Resend API 寄送 Email
```

### 5.2 需要新增的功能

#### **前端：**
1. `/admin/learning-management` 加入「報告操作」按鈕
2. 建立「報告預覽」彈出視窗（複用 `/learning` UI）
3. PDF 匯出功能
4. Email 寄送介面（收件人選擇、自訂內容）

#### **後端：**
1. **`/api/admin/generate-report`** - 生成 PDF 報告
2. **`/api/admin/send-report-email`** - 寄送報告 Email
3. **`/api/admin/schedule-reports`** - 設定自動排程

#### **資料庫：**
1. 可能需要新增 `report_templates` 表（報告模板設定）
2. 可能需要新增 `report_schedules` 表（自動排程設定）

---

## ✅ 六、下一步行動建議

### 優先級 1（必須）：
1. ✅ 建立 `/api/learning/*` 的完整 API
2. ✅ 將 `/learning` 頁面從模擬資料改為真實資料
3. ✅ 實作使用者身份驗證（確保學生只看到自己的資料）

### 優先級 2（報告功能）：
4. ✅ 在 `/admin/learning-management` 實作報告預覽
5. ✅ 實作 PDF 匯出功能
6. ✅ 整合 Email 寄送功能

### 優先級 3（進階功能）：
7. ⏰ 實作自動排程功能
8. ⏰ 批量匯出功能
9. ⏰ 報告模板自訂功能

---

## 🎯 七、技術方案建議

### PDF 生成方案：
**推薦：react-to-pdf**
- 安裝：`npm install react-to-pdf`
- 優點：簡單易用、與現有 UI 整合方便
- 適合：直接將 `/learning` 總覽頁籤轉為 PDF

### Email 寄送方案：
**使用現有的 Resend API**
- 已配置好環境變數
- 支援 PDF 附件
- 需要建立 Email 模板

### 資料整合方案：
**建議使用 React Query (TanStack Query)**
- 安裝：`npm install @tanstack/react-query`
- 優點：自動快取、自動重新載入、錯誤處理
- 適合：管理複雜的資料流程

---

## 📝 八、需要確認的問題

1. **學生 ID 如何取得？**
   - 從 AuthContext 取得？
   - 從 URL 參數取得？

2. **家長 Email 儲存在哪？**
   - `profiles` 表？
   - 需要新增 `parents` 表？

3. **報告生成時機？**
   - 即時生成（每次點擊時生成）
   - 預先生成（系統定期生成並快取）

4. **資料範圍？**
   - 只顯示當前學期？
   - 顯示所有歷史資料？
   - 可自訂日期範圍？

5. **權限控制？**
   - 哪些管理員可以匯出報告？
   - 學生能自己匯出報告嗎？
