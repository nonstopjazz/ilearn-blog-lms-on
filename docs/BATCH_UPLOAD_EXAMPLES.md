# 專案作業批次上傳範例

## 🎯 三種指定學生的方式

### 方式 1: 使用學生姓名（最方便！）

```json
[
  {
    "title": "英文閱讀作業一",
    "description": "閱讀指定文章並完成心得",
    "studentNames": ["王小明", "李小華", "張小美"],
    "dueDate": "2025-12-31",
    "isPublished": false,
    "maxScore": 100,
    "priority": "normal"
  }
]
```

### 方式 2: 使用學生 Email

```json
[
  {
    "title": "英文閱讀作業二",
    "description": "閱讀指定文章並完成心得",
    "studentEmails": ["student1@example.com", "student2@example.com"],
    "dueDate": "2025-12-31",
    "isPublished": false,
    "maxScore": 100,
    "priority": "normal"
  }
]
```

### 方式 3: 使用 UUID（舊方式，仍支援）

```json
[
  {
    "title": "英文閱讀作業三",
    "description": "閱讀指定文章並完成心得",
    "studentIds": ["uuid-1", "uuid-2"],
    "dueDate": "2025-12-31",
    "isPublished": false
  }
]
```

---

## 📝 批次上傳 100 筆範例

### 範例一：同一作業派發給多位學生

```json
[
  {
    "title": "第一週英文閱讀",
    "description": "閱讀 Chapter 1 並完成練習題",
    "studentNames": [
      "王小明", "李小華", "張小美", "陳大同", "林美玲",
      "黃志明", "吳佳佳", "鄭小龍", "周雅婷", "蔡文傑",
      "劉建國", "徐美惠", "楊怡君", "賴志偉", "謝明芳"
    ],
    "dueDate": "2025-11-15",
    "isPublished": false,
    "maxScore": 100,
    "priority": "normal",
    "estimatedDuration": 120
  },
  {
    "title": "第二週英文閱讀",
    "description": "閱讀 Chapter 2 並完成練習題",
    "studentNames": [
      "王小明", "李小華", "張小美", "陳大同", "林美玲",
      "黃志明", "吳佳佳", "鄭小龍", "周雅婷", "蔡文傑",
      "劉建國", "徐美惠", "楊怡君", "賴志偉", "謝明芳"
    ],
    "dueDate": "2025-11-22",
    "isPublished": false,
    "maxScore": 100,
    "priority": "normal"
  },
  {
    "title": "第三週英文閱讀",
    "description": "閱讀 Chapter 3 並完成練習題",
    "studentNames": [
      "王小明", "李小華", "張小美", "陳大同", "林美玲",
      "黃志明", "吳佳佳", "鄭小龍", "周雅婷", "蔡文傑"
    ],
    "dueDate": "2025-11-29",
    "isPublished": false,
    "maxScore": 100
  }
]
```

### 範例二：不同學生的個別作業

```json
[
  {
    "title": "王小明 - 個人專題研究",
    "description": "完成英文專題研究第一階段",
    "studentNames": ["王小明"],
    "dueDate": "2025-12-01",
    "isPublished": false,
    "maxScore": 100,
    "priority": "high"
  },
  {
    "title": "李小華 - 個人專題研究",
    "description": "完成英文專題研究第一階段",
    "studentNames": ["李小華"],
    "dueDate": "2025-12-01",
    "isPublished": false,
    "maxScore": 100,
    "priority": "high"
  },
  {
    "title": "張小美 - 個人專題研究",
    "description": "完成英文專題研究第一階段",
    "studentNames": ["張小美"],
    "dueDate": "2025-12-01",
    "isPublished": false,
    "maxScore": 100,
    "priority": "high"
  }
]
```

### 範例三：混合使用姓名和 Email

```json
[
  {
    "title": "期末專題報告",
    "description": "完成期末專題並準備簡報",
    "studentNames": ["王小明", "李小華"],
    "dueDate": "2025-12-20",
    "isPublished": false,
    "maxScore": 100,
    "priority": "urgent"
  },
  {
    "title": "期末專題報告",
    "description": "完成期末專題並準備簡報",
    "studentEmails": ["student3@example.com", "student4@example.com"],
    "dueDate": "2025-12-20",
    "isPublished": false,
    "maxScore": 100,
    "priority": "urgent"
  }
]
```

---

## 🔧 完整欄位說明

| 欄位 | 必填 | 說明 | 範例 |
|------|------|------|------|
| `title` | ✅ | 作業標題 | "英文閱讀作業一" |
| `description` | ❌ | 作業描述 | "閱讀指定文章並完成心得" |
| `studentNames` | ❌* | 學生姓名陣列 | ["王小明", "李小華"] |
| `studentEmails` | ❌* | 學生 Email 陣列 | ["a@example.com"] |
| `studentIds` | ❌* | 學生 UUID 陣列 | ["uuid-1", "uuid-2"] |
| `dueDate` | ❌ | 截止日期 (ISO 8601) | "2025-12-31" |
| `isPublished` | ❌ | 是否發布（預設 false） | true |
| `initialStatus` | ❌ | 初始狀態 | "not_started", "in_progress" |
| `maxScore` | ❌ | 滿分（預設 100） | 100 |
| `priority` | ❌ | 優先順序 | "low", "normal", "high", "urgent" |
| `estimatedDuration` | ❌ | 預估時長（分鐘） | 120 |
| `submissionType` | ❌ | 繳交類型 | "text", "file", "photo", "link" |
| `instructions` | ❌ | 作業說明 | "請在截止日前完成..." |
| `requirements` | ❌ | 作業要求陣列 | ["心得報告", "PPT"] |
| `tags` | ❌ | 標籤陣列 | ["閱讀", "進階"] |
| `resources` | ❌ | 資源陣列 | [] |
| `courseId` | ❌ | 課程 ID | "course-123" |

\* 三者至少要提供一個

### 🚀 快速上傳並立即顯示（最簡單！）

**在前端勾選「✅ 上傳後立即顯示給學生」，系統會自動設定：**
- `initialStatus: "in_progress"`
- `isPublished: true`

**學生立即可見！** 不需要手動編輯。

---

## 💡 實用技巧

### 1. 使用 Excel 或 Google Sheets 產生 JSON

1. 建立試算表：

| title | description | studentNames | dueDate | isPublished | priority |
|-------|-------------|--------------|---------|-------------|----------|
| 作業1 | 描述1 | 王小明,李小華 | 2025-12-31 | false | medium |
| 作業2 | 描述2 | 張小美,陳大同 | 2025-12-31 | false | high |

2. 使用公式轉換為 JSON：
```
="{""title"":"""&A2&""",""description"":"""&B2&""",""studentNames"":["""&SUBSTITUTE(C2,",",""",""")&"""],""dueDate"":"""&D2&""",""isPublished"":"&E2&",""priority"":"""&F2&"""}"
```

3. 複製結果，用 `[` 和 `]` 包起來，並在每行之間加 `,`

### 2. 使用 ChatGPT 或 Claude 產生 JSON

提示詞範例：
```
請幫我產生 20 筆專案作業的 JSON 資料，格式如下：
- title: 第 X 週英文閱讀
- description: 閱讀 Chapter X 並完成練習題
- studentNames: ["王小明", "李小華", "張小美"]
- dueDate: 從 2025-11-01 開始，每週一筆
- isPublished: false
- maxScore: 100
```

### 3. 分批上傳

如果有 100 筆資料，建議分成 10 批，每批 10 筆：
- 方便錯誤排查
- 避免超時
- 可以逐步確認結果

---

## ⚠️ 常見錯誤

### 錯誤 1: 找不到學生

```json
{
  "error": "找不到任何學生（請提供 studentIds, studentEmails 或 studentNames）"
}
```

**解決方法：**
- 確認學生姓名拼寫正確
- 確認學生已註冊在系統中
- 使用 Email 代替姓名（更準確）

### 錯誤 2: JSON 格式錯誤

```
批次上傳失敗，請檢查資料格式
```

**解決方法：**
- 使用 JSON validator 檢查格式：https://jsonlint.com/
- 確認所有引號都是雙引號 `"`
- 確認每個物件之間有逗號 `,`
- 確認陣列用 `[]` 包起來

### 錯誤 3: 日期格式錯誤

**正確格式：**
- ✅ `"2025-12-31"`
- ✅ `"2025-12-31T23:59:59Z"`
- ❌ `"31/12/2025"`
- ❌ `"2025/12/31"`

---

## 📊 批次上傳後的處理

上傳成功後，系統會回傳：

```json
{
  "success": true,
  "data": {
    "successCount": 3,
    "errorCount": 0,
    "results": [
      {
        "index": 0,
        "assignmentId": "xxx",
        "title": "作業1",
        "studentCount": 3,
        "success": true
      }
    ],
    "errors": []
  },
  "message": "批次處理完成：成功 3 項，失敗 0 項"
}
```

### 下一步：登記作業

批次上傳的作業預設 `isPublished: false`，需要：

1. 前往「專案作業」頁籤
2. 找到剛上傳的作業
3. 點擊「編輯」
4. 將狀態改為「**進行中**」
5. 學生才能在前端看到

---

## 🚀 快速測試範例

複製以下 JSON 直接貼到批次上傳對話框：

```json
[
  {
    "title": "測試作業 - 閱讀練習",
    "description": "這是一個測試作業",
    "studentNames": ["你的學生姓名"],
    "dueDate": "2025-12-31",
    "isPublished": false,
    "maxScore": 100,
    "priority": "normal"
  }
]
```

記得將 `"你的學生姓名"` 改成實際的學生姓名！
