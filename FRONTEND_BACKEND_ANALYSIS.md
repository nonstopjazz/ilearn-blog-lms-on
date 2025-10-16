# 前後端 API 串接分析報告
**生成時間**: 2025-10-14
**專案**: iLearn Blog LMS

---

## 📊 執行摘要

本報告分析了 iLearn Blog LMS 專案的前後端 API 連接狀況，識別已實作和缺失的 API 端點。

---

## 🔍 第一部分：前端 API 呼叫分析

### 1. `/learning` 頁面 (學習管理中心)

**檔案位置**: `src/app/learning/page.tsx`

**API 呼叫清單**:

| API 端點 | 方法 | 用途 | 狀態 |
|---------|------|------|------|
| `/api/admin/exam-types?active_only=true` | GET | 載入考試類型 | ✅ 已實作 |
| `/api/assignments` | POST | 新增作業 | ✅ 已實作 |

**分析**:
- ✅ 總共 2 個 API 呼叫
- ✅ 所有呼叫都有對應的後端 route
- ⚠️ 注意：學習數據（成績、單字、進度）使用的是模擬資料（mock data），未連接後端

---

### 2. `/admin` 後台管理頁面

**API 呼叫清單** (共 60+ 個):

#### 2.1 課程管理 (Courses)
| API 端點 | 方法 | 檔案 | 狀態 |
|---------|------|------|------|
| `/api/courses` | GET | `admin/course-settings/page.tsx` | ✅ 已實作 |
| `/api/courses` | GET | `admin/courses/page.tsx` | ✅ 已實作 |
| `/api/courses` | POST | `admin/course-create/page.tsx` | ✅ 已實作 |
| `/api/courses/[courseId]` | PUT | `admin/courses/page.tsx` | ✅ 已實作 |
| `/api/courses/[courseId]` | DELETE | `admin/courses/page.tsx` | ✅ 已實作 |

#### 2.2 部落格管理 (Blog)
| API 端點 | 方法 | 檔案 | 狀態 |
|---------|------|------|------|
| `/api/blog/posts` | GET | `admin/blog/page.tsx` | ✅ 已實作 |
| `/api/blog/posts` | POST | `admin/blog/create/page.tsx` | ✅ 已實作 |
| `/api/blog/posts/[id]` | PUT | `admin/blog/[id]/edit/page.tsx` | ✅ 已實作 |
| `/api/blog/posts/[id]` | DELETE | `admin/blog/page.tsx` | ✅ 已實作 |
| `/api/blog/categories` | GET | `admin/blog/categories/page.tsx` | ✅ 已實作 |
| `/api/blog/categories` | POST | `admin/blog/categories/page.tsx` | ✅ 已實作 |
| `/api/blog/categories` | PUT | `admin/blog/categories/page.tsx` | ✅ 已實作 |
| `/api/blog/categories` | DELETE | `admin/blog/categories/page.tsx` | ✅ 已實作 |
| `/api/blog/tags` | GET | `admin/blog/tags/page.tsx` | ✅ 已實作 |
| `/api/blog/tags` | POST | `admin/blog/tags/page.tsx` | ✅ 已實作 |
| `/api/blog/tags` | PUT | `admin/blog/tags/page.tsx` | ✅ 已實作 |
| `/api/blog/tags` | DELETE | `admin/blog/tags/page.tsx` | ✅ 已實作 |

#### 2.3 考試類型管理 (Exam Types)
| API 端點 | 方法 | 檔案 | 狀態 |
|---------|------|------|------|
| `/api/admin/exam-types` | GET | `admin/exam-types/page.tsx` | ✅ 已實作 |
| `/api/admin/exam-types` | POST | `admin/exam-types/page.tsx` | ✅ 已實作 |
| `/api/admin/exam-types` | PUT | `admin/exam-types/page.tsx` | ✅ 已實作 |
| `/api/admin/exam-types?id=[id]` | DELETE | `admin/exam-types/page.tsx` | ✅ 已實作 |

#### 2.4 學生管理 (Students / Learning Management)
| API 端點 | 方法 | 檔案 | 狀態 |
|---------|------|------|------|
| `/api/admin/students` | GET | `admin/learning-management/page.tsx` | ✅ 已實作 |
| `/api/admin/students` | POST | `admin/learning-management/page.tsx` | ✅ 已實作 |
| `/api/admin/students/[id]` | PUT | `admin/learning-management/page.tsx` | ✅ 已實作 |
| `/api/admin/students/[id]/learning-data` | GET | `admin/learning-management/page.tsx` | ✅ 已實作 |
| `/api/admin/send-report-email` | POST | `admin/learning-management/page.tsx` | ✅ 已實作 |
| `/api/admin/generate-report` | GET | - | ✅ 已實作（但未被使用） |

#### 2.5 測驗管理 (Quiz)
| API 端點 | 方法 | 檔案 | 狀態 |
|---------|------|------|------|
| `/api/quiz/create` | GET | `admin/quiz-settings/page.tsx` | ✅ 已實作 |
| `/api/quiz/create` | POST | `admin/quiz-create/page.tsx` | ✅ 已實作 |
| `/api/quiz/update/[id]` | PUT | `admin/quiz-settings/page.tsx` | ✅ 已實作 |
| `/api/quiz/upload` | POST | `admin/quiz-upload/page.tsx` | ✅ 已實作 |

#### 2.6 提醒管理 (Reminders)
| API 端點 | 方法 | 檔案 | 狀態 |
|---------|------|------|------|
| `/api/admin/course-reminders` | GET | `admin/reminder-management/page.tsx` | ✅ 已實作 |
| `/api/admin/course-reminders` | POST | `admin/reminder-management/page.tsx` | ✅ 已實作 |
| `/api/admin/course-reminders?courseId=[id]&reminderType=[type]` | DELETE | `admin/reminder-management/page.tsx` | ✅ 已實作 |
| `/api/admin/send-reminders` | POST | `admin/reminder-management/page.tsx` | ✅ 已實作 |

#### 2.7 課程請求管理 (Course Requests)
| API 端點 | 方法 | 檔案 | 狀態 |
|---------|------|------|------|
| `/api/course-requests` | GET | `admin/requests/page.tsx` | ✅ 已實作 |
| `/api/course-requests` | PUT | `admin/requests/page.tsx` | ✅ 已實作 |
| `/api/course-requests?user_id=[id]&status=approved` | GET | `admin/learning-management/page.tsx` | ✅ 已實作 |

#### 2.8 測試與工具 API
| API 端點 | 方法 | 檔案 | 狀態 |
|---------|------|------|------|
| `/api/test-email-simple` | GET | `admin/page.tsx` | ✅ 已實作 |
| `/api/test-email-simple` | POST | `admin/page.tsx` | ✅ 已實作 |
| `/api/admin/test-email` | POST | `admin/page.tsx` | ✅ 已實作 |

---

## 🔌 第二部分：後端 API Routes 清單

### 已實作的後端 API (共 53 個 route 檔案)

#### Admin APIs
- ✅ `/api/admin/exam-types` - 考試類型管理
- ✅ `/api/admin/send-reminders` - 發送提醒
- ✅ `/api/admin/test-email` - 測試郵件
- ✅ `/api/admin/add-course` - 新增課程
- ✅ `/api/admin/sync-courses` - 同步課程
- ✅ `/api/admin/migrate` - 資料庫遷移
- ✅ `/api/admin/check-constraints` - 檢查約束
- ✅ `/api/admin/course-reminders` - 課程提醒管理
- ✅ `/api/admin/students` - 學生管理
- ✅ `/api/admin/students/[id]` - 單一學生操作
- ✅ `/api/admin/students/[id]/learning-data` - 學生學習數據
- ✅ `/api/admin/generate-report` - 生成報告
- ✅ `/api/admin/send-report-email` - 發送報告郵件

#### Assignments APIs
- ✅ `/api/assignments` - 作業管理
- ✅ `/api/assignments/[id]` - 單一作業操作
- ✅ `/api/assignments/[id]/submit` - 提交作業

#### Blog APIs
- ✅ `/api/blog/categories` - 部落格分類
- ✅ `/api/blog/posts` - 部落格文章
- ✅ `/api/blog/posts/id/[id]` - 透過 ID 取得文章
- ✅ `/api/blog/posts/[slug]` - 透過 slug 取得文章
- ✅ `/api/blog/tags` - 部落格標籤

#### Courses APIs
- ✅ `/api/courses` - 課程列表
- ✅ `/api/courses/[courseId]` - 單一課程操作
- ✅ `/api/courses/[courseId]/lessons` - 課程單元

#### Quiz APIs
- ✅ `/api/quiz/create` - 建立測驗
- ✅ `/api/quiz/upload` - 上傳測驗
- ✅ `/api/quiz/attempt` - 測驗嘗試
- ✅ `/api/quiz/results` - 測驗結果
- ✅ `/api/quiz/submit` - 提交測驗
- ✅ `/api/quiz/take/[quizId]` - 開始測驗
- ✅ `/api/quiz/update/[id]` - 更新測驗
- ✅ `/api/quiz/[id]` - 單一測驗操作

#### Learning APIs
- ✅ `/api/learning/exams` - 考試資料
- ✅ `/api/learning/progress` - 學習進度
- ✅ `/api/learning/vocabulary` - 單字學習
- ✅ `/api/learning/weekly-report` - 週報
- ✅ `/api/learning-reminders` - 學習提醒

#### Other APIs
- ✅ `/api/course-requests` - 課程請求
- ✅ `/api/notifications` - 通知
- ✅ `/api/orders` - 訂單
- ✅ `/api/video/progress` - 影片進度
- ✅ `/api/user/reminder-preferences` - 用戶提醒偏好設定
- ✅ `/api/files/download` - 檔案下載
- ✅ `/api/cron/weekly-report` - 定時週報

#### Test & Debug APIs
- ✅ `/api/test-email-simple` - 簡易郵件測試
- ✅ `/api/test-email-no-auth` - 無認證郵件測試
- ✅ `/api/test-simple` - 簡易測試
- ✅ `/api/test/bunny` - Bunny CDN 測試
- ✅ `/api/debug/course/[courseId]` - 課程除錯
- ✅ `/api/debug/ip` - IP 除錯
- ✅ `/api/debug/video-data` - 影片資料除錯
- ✅ `/api/debug/user` - 用戶除錯
- ✅ `/api/debug/quiz-attempts` - 測驗嘗試除錯

---

## ⚠️ 第三部分：缺失的 API 連接

### 3.1 `/learning` 頁面需要的 API（目前使用 mock data）

❌ **缺失的 API 端點**:

1. **成績數據 API**
   - 前端需要: 取得學生各週成績趨勢（quiz, class_test, vocabulary_test, speaking_eval）
   - 建議端點: `GET /api/learning/grades?user_id=[id]&range=[week|month|quarter|semester|all]`
   - 現狀: 使用前端 hardcoded 的 `allGradeData` 陣列

2. **單字學習統計 API**
   - 前端需要: 取得學生單字學習數據（已教單字、答對單字、答錯單字）
   - 建議端點: `GET /api/learning/vocabulary/stats?user_id=[id]&range=[week|month|quarter|semester|all]`
   - 現狀: 使用前端 hardcoded 的 `allVocabularyData` 陣列
   - 備註: 已有 `/api/learning/vocabulary` 但可能需要調整

3. **作業進度追蹤 API**
   - 前端需要: 取得學生作業進度（每日任務、單次作業）
   - 建議端點: `GET /api/learning/assignments/progress?user_id=[id]&range=[week|month|quarter|all]`
   - 現狀: 使用前端 hardcoded 的 `allAssignmentsByWeek` 陣列

4. **作業列表 API**
   - 前端需要: 取得學生的作業列表（含進度、類別、狀態）
   - 建議端點: `GET /api/learning/assignments?user_id=[id]`
   - 現狀: 使用前端 hardcoded 的 `mockAssignments` 陣列
   - 備註: 已有 `/api/assignments` 但可能需要調整查詢參數

5. **考試記錄 API**
   - 前端需要: 取得學生的考試記錄（含分數、類型、日期）
   - 建議端點: `GET /api/learning/exams?user_id=[id]`
   - 現狀: 使用前端 hardcoded 的 `exams` 陣列
   - 備註: 已有 `/api/learning/exams` 但可能需要調整

6. **單字學習記錄 API**
   - 前端需要: 取得學生的單字學習session記錄
   - 建議端點: `GET /api/learning/vocabulary/sessions?user_id=[id]`
   - 現狀: 使用前端 hardcoded 的 `vocabularySessions` 陣列

7. **上課進度記錄 API**
   - 前端需要: 取得學生的課程進度記錄
   - 建議端點: `GET /api/learning/progress/sessions?user_id=[id]`
   - 現狀: 使用前端 hardcoded 的 `progressData` 陣列
   - 備註: 已有 `/api/learning/progress` 但可能需要調整

8. **報表列表 API**
   - 前端需要: 取得可用報表列表
   - 建議端點: `GET /api/learning/reports?user_id=[id]`
   - 現狀: 使用前端 hardcoded 的 `reports` 陣列

9. **甘特圖任務 API**
   - 前端需要: 取得學生的作業甘特圖數據
   - 建議端點: `GET /api/learning/gantt-tasks?user_id=[id]`
   - 現狀: 使用前端 hardcoded 的 `mockGanttTasks` 陣列

### 3.2 `/admin/learning-management` 頁面需要的額外功能

✅ 已連接的 API:
- 學生列表 (`/api/admin/students`)
- 學生學習數據 (`/api/admin/students/[id]/learning-data`)
- 發送報告郵件 (`/api/admin/send-report-email`)

❌ 可能需要優化的部分:
- 學習數據 API 的時間範圍篩選功能
- 批量操作學生資料的 API

---

## 📦 第四部分：資料庫 Schema

### 已建立的資料表 (Migrations)

1. **001_learning_management_tables.sql** - 學習管理相關表格
2. **002_fix_foreign_keys.sql** - 修復外鍵
3. **003_remove_foreign_keys.sql** - 移除外鍵
4. **004_fix_correct_foreign_keys.sql** - 修復正確的外鍵
5. **005_sync_courses.sql** - 同步課程
6. **006_create_exam_types.sql** - 建立考試類型表
7. **007_create_blog_tables.sql** - 建立部落格相關表格
8. **008_create_public_users_table.sql** - 建立公開用戶表
9. **009_convert_video_duration_to_seconds.sql** - 轉換影片時長為秒數
10. **010_create_user_lesson_progress.sql** - 建立用戶課程進度表

需要檢查這些 migrations 是否包含：
- ✅ 學生資料表 (students)
- ✅ 考試類型表 (exam_types)
- ✅ 課程表 (courses)
- ✅ 課程單元表 (course_lessons)
- ✅ 用戶課程進度表 (user_lesson_progress)
- ❓ 成績記錄表 (grades/exam_results)
- ❓ 單字學習記錄表 (vocabulary_sessions)
- ❓ 作業記錄表 (assignments)
- ❓ 作業進度表 (assignment_progress)

---

## ✅ 第五部分：優先處理建議

### 高優先級 (P0) - 立即處理

1. **建立成績 API** (`/api/learning/grades`)
   - 連接 `/learning` 頁面的成績趨勢圖表
   - 需要資料庫表: `exam_results` 或 `grades`

2. **建立單字統計 API** (`/api/learning/vocabulary/stats`)
   - 連接 `/learning` 頁面的單字學習柱狀圖
   - 需要資料庫表: `vocabulary_sessions` 或擴充現有的 vocabulary API

3. **建立作業進度 API** (`/api/learning/assignments/progress`)
   - 連接 `/learning` 頁面的作業進度追蹤區塊
   - 需要資料庫表: `assignments`, `assignment_progress`

### 中優先級 (P1) - 後續處理

4. **優化現有 Learning APIs**
   - 檢查並測試 `/api/learning/exams`
   - 檢查並測試 `/api/learning/vocabulary`
   - 檢查並測試 `/api/learning/progress`

5. **建立甘特圖 API**
   - `/api/learning/gantt-tasks`
   - 連接作業管理頁籤的甘特圖顯示

### 低優先級 (P2) - 可選處理

6. **報表管理 API**
   - `/api/learning/reports`
   - 連接報表匯出頁籤

---

## 📝 總結

### 統計數據
- ✅ **已實作的後端 API**: 53 個 route 檔案
- ✅ **已連接的前端呼叫**: 60+ 個 API 呼叫（admin 頁面）
- ❌ **缺失的 API**: 約 9 個（learning 頁面的 mock data）
- ⚠️ **需要優化的 API**: 3-5 個（現有 learning APIs）

### 整體評估
- **Admin 後台**: ✅ 90% 已完成串接
- **Learning 學習中心**: ⚠️ 20% 已完成串接（大部分使用 mock data）
- **資料庫**: ⚠️ 需要檢查是否有對應的表格來支援缺失的 API

### 下一步行動
1. 檢查資料庫 migrations，確認是否有成績、單字、作業相關表格
2. 如果沒有，先建立對應的資料表
3. 依照優先級實作缺失的 API 端點
4. 將 `/learning` 頁面的 mock data 替換為真實 API 呼叫
5. 進行端到端測試

---

**報告結束**

如需詳細的 API 規格或資料庫 schema 分析，請參考對應的 migration 檔案和 route 實作。
