# 專案作業管理系統使用指南

## 概述

專案作業管理系統讓管理員可以為每個學生設定專屬的專案作業，學生只能看到自己的作業（進行中和已完成狀態），並使用甘特圖方式追蹤進度。

## 功能特色

### 學生端功能
- ✅ 只顯示專屬自己的專案作業
- ✅ 只顯示「進行中」和「已完成」的作業
- ✅ 使用甘特圖視覺化呈現作業時間軸
- ✅ 保留原有的甘特圖設計和互動

### 管理員功能
- ✅ 查看所有學生的專案作業
- ✅ 編輯學生作業的完成狀況、分數和回饋
- ✅ 使用專案作業模板快速派發
- ✅ 批次上傳專案作業
- ✅ 依狀態篩選和搜尋

## 資料庫結構

### 新增的資料表

#### 1. `project_assignment_templates` - 專案作業模板
存放可重複使用的專案作業模板組。

```sql
- id: 模板 ID
- template_name: 模板名稱
- description: 模板描述
- assignments: JSONB 格式的作業陣列
- tags: 標籤陣列
- target_audience: 目標學生群
- is_active: 是否啟用
```

#### 2. `project_assignment_distributions` - 派發記錄
記錄專案作業模板的派發歷史。

```sql
- id: 記錄 ID
- template_id: 模板 ID
- student_id: 學生 ID
- distributed_at: 派發時間
- assignment_ids: 生成的作業 ID 陣列
```

### 修改的資料表

#### `assignments` 表新增欄位
```sql
- is_project_assignment: BOOLEAN - 標記是否為專案作業
- template_id: VARCHAR - 關聯的模板 ID
```

## API 端點

### 學生端 API

#### GET `/api/assignments/student`
獲取學生專屬的專案作業（只包含進行中和已完成）

**參數：**
- `student_id` (必填): 學生 UUID
- `status` (可選): 狀態篩選，預設為 `in_progress,completed`

**回應範例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "assignment-uuid",
      "title": "選題與文獻回顧",
      "status": "in_progress",
      "progress": 50,
      "dueDate": "2025-12-31",
      ...
    }
  ]
}
```

### 管理員 API

#### GET `/api/admin/project-assignments`
獲取所有學生的專案作業

**參數：**
- `student_id` (可選): 篩選特定學生
- `status` (可選): 篩選狀態

#### PATCH `/api/admin/project-assignments`
更新學生專案作業狀態

**請求體：**
```json
{
  "submissionId": "submission-uuid",
  "status": "completed",
  "score": 95,
  "feedback": "做得很好！"
}
```

#### GET `/api/admin/project-templates`
獲取所有專案作業模板

#### POST `/api/admin/project-templates`
建立新的專案作業模板

**請求體：**
```json
{
  "templateName": "英文專題研究計畫",
  "description": "適合進階學生的深度英文專題研究",
  "assignments": [
    {
      "title": "選題與文獻回顧",
      "description": "確定研究主題...",
      "estimatedDuration": 240,
      "requirements": ["研究題目", "文獻清單"]
    }
  ],
  "tags": ["專案作業", "進階"],
  "targetAudience": "進階班學生"
}
```

#### POST `/api/admin/project-templates/distribute`
派發專案作業模板給學生

**請求體：**
```json
{
  "templateId": "template-uuid",
  "studentIds": ["student-uuid-1", "student-uuid-2"],
  "startDate": "2025-11-01",
  "courseId": "course-id"
}
```

#### POST `/api/admin/project-assignments/batch`
批次建立專案作業

**請求體：**
```json
{
  "assignments": [
    {
      "title": "作業名稱",
      "description": "作業描述",
      "studentIds": ["student-uuid"],
      "dueDate": "2025-12-31",
      "isPublished": false,
      "maxScore": 100,
      "priority": "medium"
    }
  ]
}
```

## 使用流程

### 方式一：使用模板派發

1. **進入管理後台**
   - 訪問 `/admin/learning-management`
   - 切換到「專案作業」頁籤

2. **選擇模板**
   - 點擊「派發模板」按鈕
   - 從下拉選單選擇預設模板或自建模板

3. **選擇學生**
   - 勾選要派發的學生
   - 設定開始日期（可選）

4. **確認派發**
   - 系統會自動建立一系列專案作業
   - 每個作業會根據預估時長自動計算截止日期
   - 所有作業預設為「未開始」狀態

5. **登記作業**
   - 在作業列表中找到該學生的作業
   - 點擊「編輯」按鈕
   - 修改狀態為「進行中」或「已完成」
   - 學生端即可看到該作業

### 方式二：批次上傳

1. **準備 JSON 資料**
   ```json
   [
     {
       "title": "專案作業一",
       "description": "作業描述",
       "studentIds": ["student-uuid-1", "student-uuid-2"],
       "dueDate": "2025-12-31",
       "isPublished": false,
       "maxScore": 100,
       "estimatedDuration": 240,
       "priority": "high",
       "requirements": ["需求1", "需求2"],
       "instructions": "作業說明"
     }
   ]
   ```

2. **執行批次上傳**
   - 點擊「批次上傳」按鈕
   - 貼上 JSON 資料
   - 點擊「上傳」

3. **登記作業**
   - 批次上傳的作業預設為 `isPublished: false`
   - 管理員需要手動將狀態改為「進行中」或「已完成」
   - 學生才能在前端看到

### 方式三：手動建立

1. **單獨建立作業**
   - 使用現有的「新增作業」功能
   - 勾選「專案作業」選項
   - 選擇學生並設定詳細資訊

2. **登記作業**
   - 建立後在列表中編輯狀態

## 學生端體驗

1. **訪問學習頁面**
   - 前往 `/learning`
   - 切換到「專案作業」頁籤

2. **查看專案作業**
   - 只看到自己的專案作業
   - 只顯示「進行中」和「已完成」的作業
   - 使用甘特圖視覺化呈現

3. **查看統計**
   - 總作業數
   - 已完成數量
   - 進行中數量
   - 平均完成度

## 預設模板

系統已內建兩個範例模板：

### 1. 英文專題研究計畫（進階班）
- 選題與文獻回顧
- 研究架構規劃
- 資料收集與分析
- 專題報告撰寫
- 口頭簡報準備

### 2. 基礎英文閱讀計畫（基礎班）
- 繪本閱讀週
- 短篇故事理解
- 角色扮演練習
- 閱讀成果分享

## 安裝步驟

### 1. 執行資料庫 Migration

```bash
# 連接到 Supabase 並執行 migration
psql $DATABASE_URL -f db/migrations/013_create_project_assignment_templates.sql
```

或在 Supabase Dashboard 的 SQL Editor 中執行 `013_create_project_assignment_templates.sql`。

### 2. 重新部署應用

```bash
npm run build
# 部署到 Vercel
vercel --prod
```

## 注意事項

1. **作業發布流程**
   - 新建的專案作業預設 `isPublished: true`
   - 但建議批次上傳時設為 `false`，登記後才發布
   - 只有狀態為「進行中」或「已完成」的作業才會在學生端顯示

2. **狀態說明**
   - `not_started`: 未開始（學生端不顯示）
   - `in_progress`: 進行中（學生端顯示）
   - `completed`: 已完成（學生端顯示）
   - `graded`: 已評分（學生端顯示）

3. **權限控制**
   - 學生只能看到自己的專案作業
   - 管理員可以看到所有學生的作業
   - 建議在生產環境加入適當的權限驗證

## 故障排除

### 學生看不到作業
- 確認作業的 `is_published` 為 `true`
- 確認作業的 `is_project_assignment` 為 `true`
- 確認該學生有對應的 `assignment_submissions` 記錄
- 確認提交記錄的 `status` 為 `in_progress` 或 `completed`

### 管理員看不到作業
- 確認資料庫中存在作業記錄
- 檢查瀏覽器控制台是否有 API 錯誤

### 派發模板失敗
- 確認模板 ID 正確
- 確認學生 ID 為有效的 UUID
- 檢查資料庫連線狀態

## 未來擴展

- [ ] 支援拖拽調整甘特圖時間
- [ ] 支援作業依賴關係（前置作業）
- [ ] 支援自動通知學生新作業
- [ ] 支援作業進度自動追蹤
- [ ] 支援匯出專案報告
