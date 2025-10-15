# P0 API 詳細設計文檔

**建立日期**: 2025-10-15
**目的**: 實作 `/learning` 頁面所需的 3 個核心 API

---

## 📋 總覽

| API | 端點 | 用途 | 優先級 |
|-----|------|------|--------|
| 成績趨勢 API | `GET /api/learning/grades` | 成績趨勢折線圖 | P0 |
| 單字統計 API | `GET /api/learning/vocabulary/stats` | 單字學習柱狀圖 | P0 |
| 作業進度 API | `GET /api/learning/assignments/progress` | 作業進度追蹤 | P0 |

---

## 🎯 API #1: 成績趨勢 API

### 端點
```
GET /api/learning/grades
```

### 用途
為前端提供成績趨勢折線圖數據，支援多種時間範圍篩選。

### 前端需求分析

**前端代碼位置**: `src/app/learning/page.tsx:57-104`

**前端數據格式** (line 57-83):
```typescript
const allGradeData = [
  {
    name: "第1週",  // X軸顯示名稱
    quiz: 85,       // 小考分數
    class_test: 88, // 隨堂考分數
    vocabulary_test: 90,  // 單字測驗分數
    speaking_eval: 82,    // 口說評量分數
    month: 1        // 所屬月份（用於內部篩選）
  },
  // ... 更多週次資料
]
```

**時間範圍篩選** (line 86-102):
- `week` - 最近 2 週
- `month` - 最近 4 週（1個月）
- `quarter` - 最近 12 週（3個月）
- `semester` - 最近 18 週（半年）
- `all` - 全部資料

### 查詢參數

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `student_id` | string | ✅ | 學生 UUID | `uuid` |
| `course_id` | string | ❌ | 課程 ID（選填） | `course_001` |
| `range` | string | ✅ | 時間範圍 | `week`, `month`, `quarter`, `semester`, `all` |
| `year` | integer | ❌ | 年份（預設當年） | `2025` |

### 回應格式

```typescript
{
  success: true,
  data: [
    {
      week_number: 1,           // 週次
      week_label: "第1週",      // 顯示標籤
      year: 2025,               // 年份
      week_start_date: "2025-01-01",  // 週起始日
      week_end_date: "2025-01-07",    // 週結束日
      // 各考試類型的平均分數（從 exam_records 計算）
      quiz: 85.5,               // 小考平均
      class_test: 88.0,         // 隨堂考平均
      vocabulary_test: 90.0,    // 單字測驗平均
      speaking_eval: 82.0,      // 口說評量平均
      // ... 其他考試類型（從 exam_types 表動態獲取）
    },
    // ... 更多週次
  ],
  stats: {
    total_weeks: 20,
    average_score: 87.5,      // 所有考試的總平均
    highest_week: {
      week_number: 5,
      average: 94.2
    },
    lowest_week: {
      week_number: 2,
      average: 82.5
    },
    by_exam_type: {
      quiz: { average: 89.5, count: 20 },
      class_test: { average: 91.2, count: 18 },
      vocabulary_test: { average: 92.8, count: 20 },
      speaking_eval: { average: 87.3, count: 15 }
    }
  },
  metadata: {
    range: "month",
    student_id: "uuid",
    course_id: "course_001"
  }
}
```

### 實作邏輯

#### 資料來源
- **主表**: `exam_records` (考試記錄)
- **關聯表**: `exam_types` (考試類型)

#### SQL 查詢邏輯

```sql
-- 步驟 1: 計算每週、每個考試類型的平均分數
SELECT
  EXTRACT(YEAR FROM exam_date) as year,
  EXTRACT(WEEK FROM exam_date) as week_number,
  exam_type,
  AVG(percentage_score) as avg_score,
  COUNT(*) as exam_count
FROM exam_records
WHERE student_id = $1
  AND exam_date >= [計算的起始日期]
  AND exam_date <= [計算的結束日期]
  AND (course_id = $2 OR $2 IS NULL)
GROUP BY year, week_number, exam_type
ORDER BY year, week_number;

-- 步驟 2: 將結果轉換為前端需要的格式
-- 使用 PostgreSQL 的 crosstab 或在應用層進行 pivot
```

#### 時間範圍計算

```typescript
function getDateRange(range: string, year: number = new Date().getFullYear()) {
  const now = new Date();
  const currentWeek = getWeekNumber(now);

  switch (range) {
    case 'week':
      // 最近 2 週
      return {
        startWeek: currentWeek - 1,
        endWeek: currentWeek,
        year: year
      };
    case 'month':
      // 最近 4 週
      return {
        startWeek: currentWeek - 3,
        endWeek: currentWeek,
        year: year
      };
    case 'quarter':
      // 最近 12 週
      return {
        startWeek: currentWeek - 11,
        endWeek: currentWeek,
        year: year
      };
    case 'semester':
      // 最近 18 週
      return {
        startWeek: currentWeek - 17,
        endWeek: currentWeek,
        year: year
      };
    case 'all':
      // 全部資料
      return {
        startWeek: 1,
        endWeek: 52,
        year: null  // 所有年份
      };
  }
}
```

### 檔案位置
```
src/app/api/learning/grades/route.ts
```

### 參考範本
複製 `src/app/api/learning/exams/route.ts` 的結構

---

## 📚 API #2: 單字統計 API

### 端點
```
GET /api/learning/vocabulary/stats
```

### 用途
為前端提供單字學習柱狀圖數據，顯示已教、答對、答錯單字數量。

### 前端需求分析

**前端代碼位置**: `src/app/learning/page.tsx:108-155`

**前端數據格式** (line 108-134):
```typescript
const allVocabularyData = [
  {
    name: "第1週",        // X軸顯示名稱
    已教單字: 20,         // 該週教的單字總數
    答對單字: 15,         // 答對的單字數
    答錯單字: 5,          // 答錯的單字數
    month: 1             // 所屬月份
  },
  // ... 更多週次資料
]
```

**圖表需求**:
- 堆疊柱狀圖 (Stacked Bar Chart)
- 藍色柱：答對單字
- 紅色柱：答錯單字
- Tooltip 顯示：已教單字、答對、答錯、正確率

**時間範圍篩選** (line 137-153):
- `week` - 最近 2 週
- `month` - 最近 4 週
- `quarter` - 最近 12 週
- `semester` - 最近 18 週
- `all` - 全部資料

### 查詢參數

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `student_id` | string | ✅ | 學生 UUID | `uuid` |
| `course_id` | string | ❌ | 課程 ID | `course_001` |
| `range` | string | ✅ | 時間範圍 | `week`, `month`, `quarter`, `semester`, `all` |
| `year` | integer | ❌ | 年份 | `2025` |

### 回應格式

```typescript
{
  success: true,
  data: [
    {
      week_number: 1,
      week_label: "第1週",
      year: 2025,
      week_start_date: "2025-01-01",
      week_end_date: "2025-01-07",
      已教單字: 20,           // words_learned 總和
      答對單字: 15,           // 根據 accuracy_rate 計算
      答錯單字: 5,            // 已教 - 答對
      accuracy_rate: 75.0,   // 平均正確率
      total_sessions: 7,      // 本週學習次數
      total_duration: 210     // 本週學習時間（分鐘）
    },
    // ... 更多週次
  ],
  stats: {
    total_weeks: 20,
    total_words_learned: 540,      // 所有週的總單字數
    total_words_correct: 450,      // 所有答對的總數
    total_words_incorrect: 90,     // 所有答錯的總數
    overall_accuracy: 83.3,        // 整體正確率
    average_words_per_week: 27,    // 每週平均學習單字數
    total_study_time: 4200,        // 總學習時間（分鐘）
    best_week: {
      week_number: 17,
      accuracy_rate: 89.0
    },
    worst_week: {
      week_number: 2,
      accuracy_rate: 78.0
    }
  },
  metadata: {
    range: "month",
    student_id: "uuid",
    course_id: "course_001"
  }
}
```

### 實作邏輯

#### 資料來源
- **主表**: `vocabulary_sessions` (單字學習記錄)

#### SQL 查詢邏輯

```sql
-- 按週分組統計單字學習數據
SELECT
  EXTRACT(YEAR FROM session_date) as year,
  EXTRACT(WEEK FROM session_date) as week_number,
  -- 已教單字總數（本週所有 session 的 words_learned 加總）
  SUM(words_learned) as total_words_learned,
  -- 平均正確率
  AVG(accuracy_rate) as avg_accuracy_rate,
  -- 學習次數
  COUNT(*) as session_count,
  -- 學習時長
  SUM(session_duration) as total_duration
FROM vocabulary_sessions
WHERE student_id = $1
  AND session_date >= [起始日期]
  AND session_date <= [結束日期]
  AND (course_id = $2 OR $2 IS NULL)
  AND status = 'completed'
GROUP BY year, week_number
ORDER BY year, week_number;
```

#### 答對/答錯計算

```typescript
// 在應用層計算
data.forEach(week => {
  const totalWords = week.total_words_learned;
  const accuracyRate = week.avg_accuracy_rate;

  week.答對單字 = Math.round(totalWords * accuracyRate / 100);
  week.答錯單字 = totalWords - week.答對單字;
  week.已教單字 = totalWords;
});
```

### 檔案位置
```
src/app/api/learning/vocabulary/stats/route.ts
```

### 參考範本
參考現有的 `src/app/api/learning/vocabulary/route.ts` 並擴展

---

## 📝 API #3: 作業進度 API

### 端點
```
GET /api/learning/assignments/progress
```

### 用途
為前端提供作業進度追蹤數據，區分每日任務和單次作業。

### 前端需求分析

**前端代碼位置**: `src/app/learning/page.tsx:158-240`

**前端數據格式** (line 158-215):
```typescript
const allAssignmentsByWeek = [
  {
    week: "第1周",
    dateRange: "2025/1/6-1/12",
    assignments: [
      {
        name: "每日背誦單字",
        progress: 75,           // 完成百分比
        type: "daily",          // 每日任務
        description: "每天背10個新單字"
      },
      {
        name: "課文朗讀練習",
        progress: 60,
        type: "session",        // 單次作業
        description: "下次上課檢查"
      }
    ]
  },
  // ... 更多週次
]
```

**作業類型**:
- `daily` - 每日任務（顯示每週 7 天完成狀況）
- `session` - 單次作業（顯示整體進度）

**時間範圍篩選** (line 218-238):
- `week` - 最近 1 週
- `month` - 最近 4 週
- `quarter` - 最近 12 週
- `all` - 全部資料

### 查詢參數

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `student_id` | string | ✅ | 學生 UUID | `uuid` |
| `course_id` | string | ❌ | 課程 ID | `course_001` |
| `range` | string | ✅ | 時間範圍 | `week`, `month`, `quarter`, `all` |
| `year` | integer | ❌ | 年份 | `2025` |

### 回應格式

```typescript
{
  success: true,
  data: [
    {
      week_number: 1,
      week_label: "第1周",
      year: 2025,
      date_range: "2025/1/6-1/12",
      week_start_date: "2025-01-06",
      week_end_date: "2025-01-12",
      assignments: [
        {
          id: "assignment_001",
          name: "每日背誦單字",
          description: "每天背10個新單字",
          type: "daily",
          daily_type: "vocabulary",  // 每日作業類型
          progress: 75,              // 完成百分比
          completed_days: 5,         // 已完成天數（滿分7天）
          total_days: 7,            // 總天數
          streak_days: 3,           // 連續完成天數
          // 每日完成狀況（週一到週日）
          daily_completion: [
            { day: "一", completed: true },
            { day: "二", completed: true },
            { day: "三", completed: true },
            { day: "四", completed: false },
            { day: "五", completed: true },
            { day: "六", completed: true },
            { day: "日", completed: false }
          ]
        },
        {
          id: "assignment_002",
          name: "課文朗讀練習",
          description: "下次上課檢查",
          type: "session",
          assignment_type: "oral",   // 作業分類
          progress: 60,
          status: "in_progress",     // not_started, in_progress, completed, overdue
          due_date: "2025-01-12",
          submitted: false
        }
      ],
      summary: {
        total_assignments: 4,
        completed: 2,
        in_progress: 1,
        not_started: 1,
        completion_rate: 50,  // 完成率
        daily_tasks: 2,
        session_tasks: 2
      }
    },
    // ... 更多週次
  ],
  stats: {
    total_weeks: 6,
    total_assignments: 24,
    total_completed: 18,
    total_in_progress: 4,
    total_not_started: 2,
    overall_completion_rate: 75,
    daily_task_streak: 5,          // 每日任務最長連續天數
    average_progress: 78.5,        // 平均進度
    on_time_completion_rate: 90    // 準時完成率
  },
  metadata: {
    range: "month",
    student_id: "uuid",
    course_id: "course_001"
  }
}
```

### 實作邏輯

#### 資料來源
- **主表**: `assignments` (作業)
- **關聯表**: `assignment_submissions` (作業提交記錄)
- **參考表**: `daily_assignment_types` (每日作業類型)

#### SQL 查詢邏輯

```sql
-- 查詢特定學生在時間範圍內的作業及提交狀況
SELECT
  a.*,
  EXTRACT(YEAR FROM a.due_date) as year,
  EXTRACT(WEEK FROM a.due_date) as week_number,
  asub.submission_date,
  asub.status as submission_status,
  asub.score,
  asub.is_late,
  -- 計算進度
  CASE
    WHEN asub.submission_date IS NOT NULL THEN 100
    WHEN a.is_daily THEN [計算每日完成百分比]
    ELSE 0
  END as progress
FROM assignments a
LEFT JOIN assignment_submissions asub
  ON asub.assignment_id = a.id
  AND asub.student_id = $1
WHERE a.due_date >= [起始日期]
  AND a.due_date <= [結束日期]
  AND (a.course_id = $2 OR $2 IS NULL)
ORDER BY a.due_date ASC;
```

#### 每日任務進度計算

對於 `is_daily = true` 的作業，需要額外查詢每日提交記錄：

```sql
-- 查詢每日任務的完成狀況
SELECT
  DATE(submission_date) as completion_date,
  COUNT(*) as submissions
FROM assignment_submissions
WHERE assignment_id = $1
  AND student_id = $2
  AND submission_date >= [週起始日]
  AND submission_date <= [週結束日]
GROUP BY DATE(submission_date);
```

#### 數據轉換邏輯

```typescript
// 按週分組
const weeklyData = assignments.reduce((acc, assignment) => {
  const weekKey = `${assignment.year}-W${assignment.week_number}`;

  if (!acc[weekKey]) {
    acc[weekKey] = {
      week_number: assignment.week_number,
      assignments: []
    };
  }

  // 計算每日任務的詳細完成狀況
  if (assignment.is_daily) {
    const dailyCompletion = calculateDailyCompletion(assignment);
    const completedDays = dailyCompletion.filter(d => d.completed).length;

    acc[weekKey].assignments.push({
      ...assignment,
      type: 'daily',
      completed_days: completedDays,
      total_days: 7,
      progress: Math.round((completedDays / 7) * 100),
      daily_completion: dailyCompletion
    });
  } else {
    acc[weekKey].assignments.push({
      ...assignment,
      type: 'session',
      progress: assignment.submission_date ? 100 : 0
    });
  }

  return acc;
}, {});
```

### 檔案位置
```
src/app/api/learning/assignments/progress/route.ts
```

### 參考範本
參考 `src/app/api/learning/progress/route.ts` 的結構

---

## 🔄 共通規範

### API 認證
所有 API 都需要通過 API Key 驗證：
```typescript
const authResult = await verifyApiKey(request);
if (!authResult.valid) {
  return NextResponse.json(
    { success: false, error: authResult.error },
    { status: 401 }
  );
}
```

### 錯誤處理
統一的錯誤回應格式：
```typescript
{
  success: false,
  error: "錯誤類型",
  message: "詳細錯誤訊息",
  code: "ERROR_CODE"  // 可選
}
```

### 週次計算函數
```typescript
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getWeekDateRange(year: number, weekNumber: number) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysToAdd = (weekNumber - 1) * 7;
  const weekStart = new Date(firstDayOfYear.getTime() + daysToAdd * 86400000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);

  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
    label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
  };
}
```

### TypeScript 類型定義

需要在 `src/types/learning-management.ts` 中新增：

```typescript
// 成績趨勢數據
export interface GradeTrendData {
  week_number: number;
  week_label: string;
  year: number;
  week_start_date: string;
  week_end_date: string;
  [exam_type: string]: number | string;  // 動態考試類型分數
}

// 單字統計數據
export interface VocabularyStatsData {
  week_number: number;
  week_label: string;
  year: number;
  week_start_date: string;
  week_end_date: string;
  已教單字: number;
  答對單字: number;
  答錯單字: number;
  accuracy_rate: number;
  total_sessions: number;
  total_duration: number;
}

// 作業進度數據
export interface AssignmentProgressData {
  week_number: number;
  week_label: string;
  year: number;
  date_range: string;
  week_start_date: string;
  week_end_date: string;
  assignments: AssignmentProgressItem[];
  summary: {
    total_assignments: number;
    completed: number;
    in_progress: number;
    not_started: number;
    completion_rate: number;
    daily_tasks: number;
    session_tasks: number;
  };
}

export interface AssignmentProgressItem {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'session';
  progress: number;
  // daily 類型專屬欄位
  daily_type?: string;
  completed_days?: number;
  total_days?: number;
  streak_days?: number;
  daily_completion?: Array<{ day: string; completed: boolean }>;
  // session 類型專屬欄位
  assignment_type?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  due_date?: string;
  submitted?: boolean;
}
```

---

## ✅ 實作檢查清單

### API #1: 成績趨勢 API
- [ ] 建立 `src/app/api/learning/grades/route.ts`
- [ ] 實作 GET 方法
- [ ] 實作時間範圍篩選邏輯
- [ ] 實作週次計算函數
- [ ] 從 `exam_records` 查詢數據
- [ ] 按 `exam_type` 分組並計算平均分
- [ ] 動態獲取考試類型（從 `exam_types` 表）
- [ ] 轉換為前端需要的格式
- [ ] 計算統計數據（stats）
- [ ] 加入錯誤處理
- [ ] 測試 API（Postman/瀏覽器）

### API #2: 單字統計 API
- [ ] 建立 `src/app/api/learning/vocabulary/stats/route.ts`
- [ ] 實作 GET 方法
- [ ] 實作時間範圍篩選邏輯
- [ ] 從 `vocabulary_sessions` 查詢數據
- [ ] 按週分組並計算統計
- [ ] 計算答對/答錯單字數
- [ ] 轉換為前端需要的格式
- [ ] 計算統計數據（stats）
- [ ] 加入錯誤處理
- [ ] 測試 API

### API #3: 作業進度 API
- [ ] 建立 `src/app/api/learning/assignments/progress/route.ts`
- [ ] 實作 GET 方法
- [ ] 實作時間範圍篩選邏輯
- [ ] 查詢作業和提交記錄
- [ ] 區分每日任務和單次作業
- [ ] 計算每日任務的完成狀況
- [ ] 計算單次作業的進度
- [ ] 按週分組數據
- [ ] 計算每週摘要統計
- [ ] 計算整體統計數據
- [ ] 加入錯誤處理
- [ ] 測試 API

### 通用任務
- [ ] 更新 TypeScript 類型定義
- [ ] 更新 PROJECT_STATUS.md
- [ ] 前端整合測試
- [ ] 提交 Git commit
- [ ] 部署到 Vercel

---

## 📝 注意事項

1. **週次計算一致性**: 所有 API 都使用相同的週次計算邏輯
2. **時區處理**: 統一使用 UTC 或當地時區，需在文檔中註明
3. **性能優化**: 考慮為大數據量添加分頁或快取
4. **數據驗證**: 確保所有必填參數都有驗證
5. **錯誤處理**: 提供清晰的錯誤訊息，方便前端處理
6. **向後兼容**: 如果未來需要修改，確保不破壞現有功能

---

## 🚀 實作順序建議

1. **先實作成績 API** - 相對簡單，可以快速驗證整體架構
2. **再實作單字統計 API** - 類似成績 API，但需要額外計算
3. **最後實作作業進度 API** - 最複雜，涉及多種類型和狀態

**預計時間**:
- 成績 API: 1-1.5 小時
- 單字統計 API: 45 分鐘 - 1 小時
- 作業進度 API: 1.5-2 小時
- 測試與整合: 1 小時

**總計**: 約 4-5 小時

---

**文檔版本**: v1.0
**最後更新**: 2025-10-15
