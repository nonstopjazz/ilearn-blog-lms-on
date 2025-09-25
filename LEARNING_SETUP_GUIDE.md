# 學習管理系統設置指南

## ✅ 已完成的功能

### 1. 資料庫表格建立
已建立以下新表格和擴展：
- ✅ **assignments 表擴展** - 新增週次、每日類型、提交類型等欄位
- ✅ **daily_assignment_types** - 每日作業類型管理
- ✅ **vocabulary_sessions** - 單字學習追蹤（累積編號制）
- ✅ **exam_records** - 考試成績管理
- ✅ **special_projects** - 特殊專案追蹤
- ✅ **assignment_submissions** - 作業提交記錄
- ✅ **learning_progress_stats** - 學習進度統計
- ✅ **parent_notifications** - 家長通知記錄

### 2. 後端 API 路由
已實作的 API 端點：
- ✅ `/api/learning/vocabulary` - 單字學習 CRUD
- ✅ `/api/learning/exams` - 考試記錄 CRUD
- ✅ `/api/learning/progress` - 學習進度統計和摘要
- ✅ `/api/learning/weekly-report` - 週報告生成
- ✅ `/api/cron/weekly-report` - 自動排程生成週報告

### 3. 前端介面
已建立的頁面和組件：
- ✅ `/learning` - 學習管理主頁面
- ✅ `VocabularyTracker` - 單字學習追蹤組件
- ✅ `ProgressCharts` - 圖表化進度分析組件

### 4. 自動化功能
- ✅ 每週自動報告（Vercel Cron Job 配置）
- ✅ 週報告郵件通知（需配置郵件服務）

## 📋 設置步驟

### 步驟 1：執行資料庫遷移
```bash
# 在 Supabase SQL Editor 中執行
# 檔案路徑：db/migrations/001_learning_management_tables.sql
```

### 步驟 2：設定環境變數
複製 `.env.example.learning` 的內容到 `.env.local`：
```bash
CRON_SECRET=your-secure-cron-secret-here
API_KEY=your-internal-api-key-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 步驟 3：安裝相依套件（如果需要圖表功能）
```bash
# 選擇性安裝（如果要使用更進階的圖表）
npm install recharts
# 或
npm install chart.js react-chartjs-2
```

### 步驟 4：部署到 Vercel
1. 推送代碼到 GitHub
2. 在 Vercel 中導入專案
3. 設定環境變數
4. 部署專案

### 步驟 5：驗證功能
1. 訪問 `/learning` 頁面查看學習管理介面
2. 測試單字學習記錄功能
3. 檢查 API 端點是否正常運作

## 🔧 測試 API

### 測試單字學習 API
```bash
# 新增單字學習記錄
curl -X POST http://localhost:3000/api/learning/vocabulary \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "student_id": "student-uuid",
    "course_id": "course-id",
    "session_date": "2024-01-20",
    "start_number": 1,
    "end_number": 50,
    "session_duration": 30,
    "accuracy_rate": 85
  }'
```

### 測試考試記錄 API
```bash
# 新增考試記錄
curl -X POST http://localhost:3000/api/learning/exams \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "student_id": "student-uuid",
    "course_id": "course-id",
    "exam_type": "quiz",
    "exam_name": "週測驗",
    "exam_date": "2024-01-20",
    "total_score": 85,
    "max_score": 100
  }'
```

### 測試學習進度 API
```bash
# 取得學習摘要
curl http://localhost:3000/api/learning/progress?student_id=student-uuid&summary=true \
  -H "x-api-key: your-api-key"
```

## 📊 功能特色

### 1. 單字學習追蹤
- 累積編號制（例：1-50, 51-100）
- 自動計算學習數量
- 正確率追蹤
- 學習時長記錄

### 2. 考試成績管理
- 多種考試類型（小考、段考、期末考）
- 自動計算成績等級
- 錯誤記錄分析
- 班級排名追蹤

### 3. 圖表化分析
- 每日/週/月學習趨勢
- 單字學習進度圖
- 考試成績走勢
- 學習時間分布

### 4. 自動週報告
- 每週日晚上 8 點自動生成
- 包含完整學習統計
- 個性化學習建議
- 家長郵件通知

## ⚠️ 注意事項

1. **資料庫連接**：確保 Supabase 連接正常
2. **API 金鑰**：生產環境必須設定安全的 API 金鑰
3. **時區設定**：Cron Job 使用 UTC 時間，需根據實際時區調整
4. **郵件服務**：週報告郵件功能需要配置郵件服務（如 SendGrid、Resend）

## 🚀 下一步優化建議

1. **增強圖表功能**
   - 整合 Recharts 或 Chart.js
   - 添加更多視覺化選項

2. **移動端優化**
   - 響應式設計改進
   - PWA 支援

3. **通知系統**
   - 整合推送通知
   - LINE/WhatsApp 整合

4. **AI 分析**
   - 學習模式識別
   - 個性化建議引擎

## 📝 維護說明

### 資料庫備份
建議定期備份學習數據：
```sql
-- 導出學習相關表格
pg_dump -t vocabulary_sessions -t exam_records -t special_projects
```

### 日誌監控
監控關鍵 API 日誌：
- `/api/learning/weekly-report` - 週報告生成
- `/api/cron/weekly-report` - 排程執行狀態

## 🆘 故障排除

### 問題：週報告未自動生成
1. 檢查 `CRON_SECRET` 環境變數
2. 查看 Vercel Functions 日誌
3. 驗證 cron 表達式設定

### 問題：API 回應 401 錯誤
1. 檢查 API 金鑰設定
2. 確認請求標頭包含 `x-api-key`

### 問題：資料庫連接失敗
1. 檢查 Supabase 環境變數
2. 確認資料庫表格已建立
3. 驗證網路連接

---

完成以上設置後，您的學習管理系統就可以正常運作了！