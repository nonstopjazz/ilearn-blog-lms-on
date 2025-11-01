# 學生作業檢查狀態功能更新（修正版）

## 更新日期
2025-11-01

## 問題說明
原先的設計有誤：使用 `visible_to_student` 欄位控制作業可見性會導致學生無法立即看到老師出的作業，違反了基本的教學流程。

## 正確的需求
1. **老師出作業後** → 學生**立即看到**作業內容（知道要做什麼）
2. **作業顯示狀態**：
   - 剛出作業時：顯示「待檢查」（灰色），表示老師尚未填寫完成狀況
   - 一定時間後老師填寫完成狀況：根據完成情況顯示不同顏色
     - 每日作業：完成度 ≥80% → 綠色（表現優良）
     - 每日作業：完成度 50-79% → 黃色（需加強）
     - 每日作業：完成度 <50% → 紅色（待改進）
     - 一次性作業：已完成 → 綠色
     - 一次性作業：部分完成 → 黃色
     - 一次性作業：未完成 → 紅色

## 解決方案

### 1. 資料庫層面更新
**檔案**: `db/migrations/015_fix_assignment_review_status.sql`

- 新增 `review_status` 欄位：
  - `pending` - 待檢查（老師尚未填寫完成狀況）
  - `reviewed` - 已檢查（老師已填寫完成狀況）

- 移除 `visible_to_student` 相關的觸發器和函數

- 更新 RLS 政策：
  - 學生可以看到所有自己的作業（無論 `review_status`）
  - 管理員可以查看、新增、更新、刪除所有作業

- 創建自動觸發器：
  - 當管理員更新每日作業的 `daily_completion` 時，自動設置 `review_status = 'reviewed'`
  - 當管理員更新一次性作業的狀態時，自動設置 `review_status = 'reviewed'`
  - 當管理員填寫 `score` 或 `teacher_feedback` 時，自動設置 `review_status = 'reviewed'`

### 2. API 層面更新

#### 檔案: `src/app/api/admin/student-tasks/route.ts`
- 新增作業時設置 `review_status = 'pending'`（學生可以立即看到作業）

#### 檔案: `src/app/api/admin/student-tasks/[id]/route.ts`
- 允許更新 `review_status` 欄位
- 移除 `visible_to_student` 相關邏輯

### 3. 前端 UI 更新

#### 檔案: `src/app/learning/page.tsx` (學生頁面)
- **每日任務顯示邏輯**：
  - `review_status = 'pending'` → 灰色背景，顯示「待檢查」
  - `review_status = 'reviewed'` + 完成度 ≥80% → 綠色背景，顯示「表現優良」
  - `review_status = 'reviewed'` + 完成度 50-79% → 黃色背景，顯示「需加強」
  - `review_status = 'reviewed'` + 完成度 <50% → 紅色背景，顯示「待改進」

- **一次性任務顯示邏輯**：
  - `review_status = 'pending'` → 灰色背景，顯示「待檢查」
  - `review_status = 'reviewed'` + `status = 'completed'` → 綠色背景，顯示「已完成」
  - `review_status = 'reviewed'` + `status = 'in_progress'` → 黃色背景，顯示「部分完成」
  - `review_status = 'reviewed'` + `status = 'assigned'` → 紅色背景，顯示「未完成」
  - `review_status = 'reviewed'` + `status = 'overdue'` → 紅色背景，顯示「逾期」

#### 檔案: `src/app/admin/learning-management/page.tsx` (管理員頁面)
- 顯示每個作業的檢查狀態（「已檢查」或「待檢查」）
- 移除「顯示/隱藏」按鈕（不再需要）
- 保留「登記完成記錄」功能

## 使用流程

### 正確的工作流程
1. 管理員在 `/admin/learning-management` 頁面新增學生作業
2. 作業創建後，`review_status = 'pending'`，學生**立即可以在** `/learning` 頁面看到作業（顯示為灰色「待檢查」）
3. 學生知道要完成什麼作業
4. 等待一段時間（例如一週後）
5. 管理員點擊「管理作業」→ 點擊「登記完成記錄」，填寫學生的完成狀況
6. 系統自動將 `review_status` 設為 `'reviewed'`
7. 學生在 `/learning` 頁面看到作業變成對應的顏色（綠色/黃色/紅色）

## 資料庫 Migration 執行步驟

1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 貼上並執行 `db/migrations/015_fix_assignment_review_status.sql`
4. 驗證執行結果：
   ```sql
   SELECT
     COUNT(*) as total_tasks,
     COUNT(*) FILTER (WHERE review_status = 'pending') as pending_tasks,
     COUNT(*) FILTER (WHERE review_status = 'reviewed') as reviewed_tasks
   FROM student_tasks;
   ```

## 顏色方案總結

### 每日任務
| 檢查狀態 | 完成度 | 背景顏色 | 顯示文字 |
|---------|--------|---------|----------|
| pending | - | 灰色 | 待檢查 |
| reviewed | ≥80% | 綠色 | 表現優良 |
| reviewed | 50-79% | 黃色 | 需加強 |
| reviewed | <50% | 紅色 | 待改進 |

### 一次性任務
| 檢查狀態 | 作業狀態 | 背景顏色 | 顯示文字 |
|---------|---------|---------|----------|
| pending | - | 灰色 | 待檢查 |
| reviewed | completed | 綠色 | 已完成 |
| reviewed | in_progress | 黃色 | 部分完成 |
| reviewed | assigned | 紅色 | 未完成 |
| reviewed | overdue | 紅色 | 逾期 |

## 安全性考量

- 使用 RLS 政策確保學生只能看到自己的作業
- 管理員擁有完整的作業管理權限
- 所有操作都經過適當的權限驗證

## 向後兼容性

- 保留 `visible_to_student` 欄位（可選）
- 現有的作業會被自動檢查：
  - 已有完成記錄的作業會自動設為 `review_status = 'reviewed'`
  - `visible_to_student = true` 的作業也會自動設為 `review_status = 'reviewed'`
  - 沒有完成記錄的作業保持 `review_status = 'pending'`

## 影響範圍

### 影響的頁面
- `/admin/learning-management` - 管理員學習管理頁面
- `/learning` - 學生學習頁面

### 影響的 API
- `POST /api/admin/student-tasks` - 新增學生作業
- `PATCH /api/admin/student-tasks/[id]` - 更新學生作業
- `GET /api/learning/tasks` - 取得學生作業列表

## 測試建議

1. **創建新作業測試**：
   - 創建新作業
   - 驗證學生頁面立即顯示作業（灰色「待檢查」）
   - 登記完成狀況
   - 驗證學生頁面作業變成對應的顏色

2. **完成度測試（每日作業）**：
   - 創建每日作業
   - 填寫不同的完成天數（0%, 40%, 60%, 90%）
   - 驗證顯示不同的顏色（灰色/紅色/黃色/綠色）

3. **狀態測試（一次性作業）**：
   - 創建一次性作業
   - 設置不同的狀態（assigned, in_progress, completed, overdue）
   - 驗證顯示對應的顏色
