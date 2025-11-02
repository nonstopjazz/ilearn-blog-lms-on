# 學生作業可見性控制功能更新

## 更新日期
2025-11-01

## 問題描述
之前的系統中，管理員在出作業給學生後，作業會立即在學生的學習頁面顯示，無法實現「先出作業 → 等待一段時間 → 填寫完成狀況 → 才向學生顯示」的工作流程。

## 解決方案

### 1. 資料庫層面更新
**檔案**: `db/migrations/014_add_visibility_control_to_student_tasks.sql`

- 為 `student_tasks` 表新增以下欄位：
  - `visible_to_student`: BOOLEAN - 控制作業是否向學生顯示（預設為 `false`）
  - `graded_at`: TIMESTAMPTZ - 記錄管理員登記完成狀況的時間
  - `graded_by`: UUID - 記錄登記完成狀況的管理員 ID

- 啟用 Row Level Security (RLS) 政策：
  - 學生只能查看 `visible_to_student = true` 且 `student_id` 為自己的作業
  - 管理員可以查看、新增、更新、刪除所有作業

- 創建自動觸發器：
  - 當管理員更新每日作業的 `daily_completion` 時，自動設置 `visible_to_student = true`
  - 當管理員更新一次性作業的狀態為 `completed` 或 `in_progress` 時，自動設置 `visible_to_student = true`

### 2. API 層面更新

#### 檔案: `src/app/api/admin/student-tasks/route.ts`
- 新增作業時預設 `visible_to_student = false`
- 作業創建後不會立即顯示給學生

#### 檔案: `src/app/api/admin/student-tasks/[id]/route.ts`
- 允許更新 `visible_to_student` 欄位
- 管理員可以手動控制作業的可見性

### 3. 前端 UI 更新

#### 檔案: `src/app/admin/learning-management/page.tsx`
- 在「管理作業」對話框中：
  - 顯示每個作業的可見性狀態（「學生可見」或「學生不可見」）
  - 添加「顯示/隱藏」按鈕，讓管理員可以手動切換作業的可見性
  - 每日任務和一次性任務都支持可見性控制

## 使用流程

### 工作流程 1: 自動顯示（推薦）
1. 管理員在 `/admin/learning-management` 頁面新增學生作業
2. 作業創建後，`visible_to_student = false`，學生看不到這個作業
3. 等待一段時間（例如一週後）
4. 管理員點擊「管理作業」→ 點擊「登記完成記錄」，填寫學生的完成狀況
5. 系統自動將 `visible_to_student` 設為 `true`，學生可以在 `/learning` 頁面看到作業

### 工作流程 2: 手動顯示
1. 管理員在 `/admin/learning-management` 頁面新增學生作業
2. 作業創建後，`visible_to_student = false`，學生看不到這個作業
3. 等待一段時間後，管理員可以隨時：
   - 點擊「管理作業」查看該學生的所有作業
   - 點擊「顯示」按鈕手動將作業設為可見
   - 學生立即可以在 `/learning` 頁面看到作業

### 工作流程 3: 隱藏已顯示的作業
1. 如果需要暫時隱藏某個作業（例如修改內容）
2. 管理員點擊「管理作業」→ 點擊「隱藏」按鈕
3. 作業從學生頁面消失，但數據不會被刪除

## 資料庫 Migration 執行步驟

1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 貼上並執行 `db/migrations/014_add_visibility_control_to_student_tasks.sql`
4. 驗證執行結果：
   ```sql
   SELECT
     COUNT(*) as total_tasks,
     COUNT(*) FILTER (WHERE visible_to_student = true) as visible_tasks,
     COUNT(*) FILTER (WHERE visible_to_student = false) as hidden_tasks
   FROM student_tasks;
   ```

## 安全性考量

- 使用 RLS 政策確保學生只能看到被允許的作業
- 管理員擁有完整的作業管理權限
- 所有操作都經過適當的權限驗證

## 向後兼容性

- 現有的作業會被自動檢查：
  - 已有完成記錄的作業會自動設為 `visible_to_student = true`
  - 沒有完成記錄的作業保持 `visible_to_student = false`

## 影響範圍

### 影響的頁面
- `/admin/learning-management` - 管理員學習管理頁面
- `/learning` - 學生學習頁面

### 影響的 API
- `POST /api/admin/student-tasks` - 新增學生作業
- `PATCH /api/admin/student-tasks/[id]` - 更新學生作業
- `GET /api/learning/tasks` - 取得學生作業列表（受 RLS 政策影響）

## 測試建議

1. **創建新作業測試**：
   - 創建新作業
   - 驗證學生頁面看不到作業
   - 登記完成狀況
   - 驗證學生頁面可以看到作業

2. **手動切換測試**：
   - 創建新作業
   - 手動點擊「顯示」按鈕
   - 驗證學生頁面立即顯示作業
   - 點擊「隱藏」按鈕
   - 驗證學生頁面立即隱藏作業

3. **RLS 政策測試**：
   - 以學生身份登入
   - 驗證只能看到 `visible_to_student = true` 的作業
   - 驗證無法看到其他學生的作業
