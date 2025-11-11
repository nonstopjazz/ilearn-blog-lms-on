# AI 作文批改功能設定指南

本文檔說明如何設定和使用 AI 自動批改作文功能。

## 功能概述

系統整合 **Google Cloud Vision OCR** 和 **DeepSeek V3 AI**，提供完整的作文批改解決方案：

### 文字作文批改
- 直接使用 DeepSeek V3 AI 分析作文內容

### 圖片作文批改（手寫英文）
- Google Cloud Vision API 自動辨識手寫英文
- 支援多張圖片（2-5 張）
- OCR 辨識後自動進行 AI 批改
- 顯示辨識文字供教師確認

### 評分項目
- 5 項評分指標（各 0-100 分）
  - 內容完整性 (Content Completeness)
  - 文法正確性 (Grammar Accuracy)
  - 結構組織 (Structure Organization)
  - 用詞精確度 (Vocabulary Precision)
  - 創意表達 (Creative Expression)
- 詳細的批改分析（繁體中文）
- 具體的改進建議

## 系統需求

- DeepSeek API Key（必需）
- Google Cloud Vision API 服務帳號金鑰（必需）
- Next.js 專案部署於 Vercel（或其他支援環境變數的平台）
- 支援文字作文和圖片作文（手寫英文）

## 設定步驟

### 1. 取得 DeepSeek API Key

1. 前往 [DeepSeek 官網](https://platform.deepseek.com/)
2. 註冊帳號並登入
3. 進入 API Keys 頁面
4. 點擊「Create API Key」
5. 複製並妥善保存您的 API Key

**重要提醒**：
- API Key 具有高敏感性，請勿公開或提交至版本控制系統
- 建議定期輪換 API Key 以確保安全性

### 2. 取得 Google Cloud Vision API 金鑰

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Cloud Vision API**：
   - 左側選單 → APIs & Services → Library
   - 搜尋「Cloud Vision API」
   - 點擊「Enable」
4. 建立服務帳號並下載 JSON 金鑰：
   - 左側選單 → IAM & Admin → Service Accounts
   - 點擊「Create Service Account」
   - 輸入名稱（例如：essay-ocr-service）
   - 角色選擇：Cloud Vision API User
   - 點擊「Create and Continue」→「Done」
   - 點擊剛建立的服務帳號
   - 切換至「Keys」分頁
   - 點擊「Add Key」→「Create new key」
   - 選擇 JSON 格式
   - 下載 JSON 金鑰檔案
5. 設定帳單帳戶（如果尚未設定）

**重要提醒**：
- JSON 金鑰檔案包含私鑰，請妥善保存
- 不要將金鑰檔案提交至版本控制系統
- Google Vision 提供每月 1000 次免費額度

### 3. 本地開發環境設定

在專案根目錄建立 `.env.local` 檔案（如果不存在）：

```bash
# DeepSeek AI API Key（用於作文批改）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Google Cloud Vision API（用於圖片 OCR）
# 將整個 JSON 金鑰檔案內容複製貼上，整個檔案包含大括號 { }
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com",...}
```

**替換說明**：
- 將 `your_deepseek_api_key_here` 替換為您實際的 DeepSeek API Key
- 將整個 JSON 金鑰檔案內容貼在 `GOOGLE_CLOUD_CREDENTIALS_JSON=` 後面
- JSON 內容應該在同一行，不要換行

### 4. Vercel 生產環境設定

#### 方法一：透過 Vercel Dashboard

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案
3. 進入 **Settings** → **Environment Variables**
4. 新增環境變數 #1：
   - **Name**: `DEEPSEEK_API_KEY`
   - **Value**: 您的 DeepSeek API Key
   - **Environments**: 勾選 `Production`, `Preview`, `Development`
   - 點擊 **Save**
5. 新增環境變數 #2：
   - **Name**: `GOOGLE_CLOUD_CREDENTIALS_JSON`
   - **Value**: 您的 Google Cloud JSON 金鑰內容（整個 JSON 檔案內容）
   - **Environments**: 勾選 `Production`, `Preview`, `Development`
   - 點擊 **Save**
6. 重新部署專案以套用環境變數

#### 方法二：透過 Vercel CLI

```bash
# 安裝 Vercel CLI（如果尚未安裝）
npm i -g vercel

# 登入 Vercel
vercel login

# 新增環境變數
vercel env add DEEPSEEK_API_KEY

# 輸入您的 API Key
# 選擇環境：Production, Preview, Development（全選）

# 重新部署
vercel --prod
```

### 5. 驗證設定

在專案部署完成後：

#### 測試文字作文批改
1. 登入管理員介面
2. 進入 **作文管理** → 選擇任一文字作文
3. 切換至「編輯評分」分頁
4. 點擊「🌟 AI 輔助批改」按鈕
5. 等待 AI 分析完成（約 5-10 秒）
6. 查看 AI 建議的評分和評語

#### 測試圖片作文批改
1. 登入管理員介面
2. 進入 **作文管理** → 選擇任一圖片作文
3. 切換至「編輯評分」分頁
4. 點擊「🌟 AI 輔助批改 (含 OCR 辨識)」按鈕
5. 等待 OCR 辨識 + AI 分析（約 10-20 秒，視圖片數量）
6. 查看 OCR 辨識文字和 AI 建議

**常見錯誤訊息**：
- 「DeepSeek API Key 未設定」→ 檢查 DEEPSEEK_API_KEY 環境變數
- 「Google Cloud credentials 未設定」→ 檢查 GOOGLE_CLOUD_CREDENTIALS_JSON 環境變數
- 「無法辨識圖片中的文字」→ 確認圖片清晰度和網路連線

## 使用方式

### 管理員批改流程

1. **進入批改頁面**
   - 路徑：`/admin/essays/[id]/edit`
   - 選擇要批改的作文

2. **使用 AI 輔助批改**（支援文字和圖片作文）
   - 切換至「編輯評分」分頁
   - 點擊「🌟 AI 輔助批改」按鈕
   - 文字作文：AI 直接分析（約 5-10 秒）
   - 圖片作文：先 OCR 辨識再 AI 分析（約 10-20 秒）

3. **查看 AI 建議**
   - **建議分數**：5 項評分指標的建議分數
   - **詳細分析**：作文的優點和待改進之處
   - **改進建議**：具體的改善方向

4. **採用或調整**
   - **採用 AI 建議**：一鍵套用 AI 建議的所有分數和評語
   - **手動調整**：關閉 AI 建議，自行調整評分和評語
   - 採用後仍可繼續手動微調

5. **儲存批改結果**
   - 確認評分和評語後，點擊「儲存評分」

## API 使用成本

### 文字作文批改
DeepSeek V3 API 定價（2025 年資料）：
- **輸入**：$0.27 / 百萬 tokens
- **輸出**：$1.10 / 百萬 tokens
- **預估成本**：每篇約 $0.0007（不到 0.1 元台幣）

**範例計算**（500 字作文）：
- 輸入：約 800 tokens（作文 + 提示詞）
- 輸出：約 300 tokens（評分 + 評語）
- 總成本：約 $0.00055

### 圖片作文批改（含 OCR）
Google Cloud Vision API + DeepSeek V3：
- **OCR 成本**：$1.50 / 1000 次呼叫（每月 1000 次免費）
- **AI 批改**：$0.0007 / 篇
- **預估總成本**（3 張圖片）：約 $0.0052

**範例計算**（3 張圖片作文）：
- Google Vision OCR：$0.0045（3 張圖片）
- DeepSeek AI 批改：$0.0007
- 總成本：約 $0.0052（約 0.16 元台幣）

**免費額度**：
- Google Vision：每月 1000 次免費 = 約 330 篇圖片作文（3 張/篇）
- DeepSeek：無免費額度，但成本極低

## 限制與注意事項

### 目前支援
- ✅ 文字作文自動批改
- ✅ 圖片作文 OCR 辨識（手寫英文）
- ✅ 多張圖片支援（2-5 張）
- ✅ 繁體中文評語
- ✅ 5 項評分指標
- ✅ 教師可調整 AI 建議
- ✅ 顯示 OCR 辨識文字供確認

### 技術限制
- OCR 辨識準確度受圖片清晰度影響
- 手寫字跡過於潦草可能影響辨識
- 圖片作文批改耗時較長（10-20 秒）
- 需要穩定的網路連線

### 最佳實務
- **圖片品質**：確保圖片清晰、光線充足、無反光
- **手寫要求**：建議學生書寫工整，避免過於潦草
- **確認 OCR**：教師應檢查 OCR 辨識文字是否正確
- **人工調整**：AI 建議僅供參考，教師應依教學經驗調整
- **成本控管**：定期檢查 API 用量，避免超出預算
- **特殊情況**：複雜或特殊主題的作文建議人工批改

## 故障排除

### 問題 1：顯示「DeepSeek API Key 未設定」

**解決方法**：
1. 檢查 `.env.local`（本地）或 Vercel 環境變數（生產）是否正確設定
2. 確認變數名稱為 `DEEPSEEK_API_KEY`（區分大小寫）
3. 重新啟動開發伺服器或重新部署 Vercel

### 問題 2：AI 批改失敗

**可能原因**：
- API Key 無效或過期
- 網路連線問題
- DeepSeek API 服務中斷

**解決方法**：
1. 檢查 API Key 是否正確
2. 查看瀏覽器開發者工具 Console 錯誤訊息
3. 稍後再試

### 問題 3：顯示「Google Cloud credentials 未設定」

**解決方法**：
1. 檢查 `.env.local` 或 Vercel 環境變數中的 `GOOGLE_CLOUD_CREDENTIALS_JSON`
2. 確認 JSON 內容完整（包含 `{` 和 `}`）
3. 確認 JSON 格式正確（可以用 JSON 驗證工具檢查）
4. 重新啟動開發伺服器或重新部署 Vercel

### 問題 4：OCR 辨識結果不正確

**可能原因**：
- 圖片模糊或光線不足
- 手寫字跡過於潦草
- 圖片角度傾斜

**解決方法**：
1. 確認原始圖片品質
2. 請學生重新拍攝清晰的圖片
3. 教師手動修正 OCR 錯誤後再進行批改

### 問題 5：圖片作文批改超時

**可能原因**：
- 網路連線緩慢
- 圖片檔案過大
- API 服務回應慢

**解決方法**：
1. 檢查網路連線
2. 壓縮圖片檔案大小（建議 < 5MB）
3. 稍後再試

## 技術架構

### API 端點

#### AI 批改 API
- **路徑**：`/api/essays/ai-grade`
- **方法**：POST
- **參數**：
  ```json
  {
    "essay_id": "作文ID"
  }
  ```
- **回應**：
  ```json
  {
    "success": true,
    "data": {
      "scores": {
        "content": 85,
        "grammar": 80,
        "structure": 82,
        "vocabulary": 78,
        "creativity": 88
      },
      "teacher_comment": "詳細分析...",
      "overall_comment": "總體評語...",
      "suggestions": ["建議1", "建議2", "建議3"],
      "ocr_text": "OCR辨識文字（圖片作文才有）"
    }
  }
  ```

#### OCR API
- **路徑**：`/api/ocr/vision`
- **方法**：POST
- **參數**：
  ```json
  {
    "image_urls": ["url1", "url2", "url3"]
  }
  ```

### 前端元件
- **檔案**：`/src/app/admin/essays/[id]/edit/page.tsx`
- **AI 按鈕位置**：「編輯評分」分頁頂部
- **功能**：自動判斷作文類型，執行相應批改流程

### 相關檔案
```
/src/app/api/essays/ai-grade/route.ts      # AI 批改 API（含 OCR 整合）
/src/app/api/ocr/vision/route.ts           # Google Cloud Vision OCR API
/src/app/admin/essays/[id]/edit/page.tsx   # 管理員批改頁面
/src/lib/supabase-server.ts                # Supabase 資料庫連接
AI_GRADING_SETUP.md                        # 本設定文檔
.env.example                               # 環境變數範例
```

## 未來功能規劃

### 階段 3：進階 OCR 功能
- 支援更多語言（中文、日文等）
- 辨識數學公式和圖表
- 自動校正 OCR 錯誤

### 階段 4：批改歷史追蹤
- 記錄每次 AI 批改的結果
- 比對教師調整前後的差異
- 用於改進 AI 批改準確度

### 階段 5：學生進步追蹤
- 追蹤學生歷次作文評分
- 生成進步報告和建議
- 識別學生強項和弱項

## 技術支援

如有任何問題，請聯絡系統管理員或參考：
- [DeepSeek API 文檔](https://platform.deepseek.com/docs)
- [Vercel 環境變數文檔](https://vercel.com/docs/environment-variables)

---

**最後更新**：2025-01-11
**版本**：2.0.0（文字 + 圖片作文批改）

**版本歷史**：
- v2.0.0 (2025-01-11): 新增圖片作文 OCR 批改功能（Google Cloud Vision）
- v1.0.0 (2025-01-11): 初版，文字作文批改功能（DeepSeek AI）
