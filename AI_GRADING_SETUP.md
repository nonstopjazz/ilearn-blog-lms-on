# AI 作文批改功能設定指南

本文檔說明如何設定和使用 AI 自動批改作文功能。

## 功能概述

系統使用 **DeepSeek V3** AI 模型自動分析英文作文，提供：
- 5 項評分指標（各 0-100 分）
  - 內容完整性 (Content Completeness)
  - 文法正確性 (Grammar Accuracy)
  - 結構組織 (Structure Organization)
  - 用詞精確度 (Vocabulary Precision)
  - 創意表達 (Creative Expression)
- 詳細的批改分析（繁體中文）
- 具體的改進建議

## 系統需求

- DeepSeek API Key
- Next.js 專案部署於 Vercel（或其他支援環境變數的平台）
- 文字作文內容（目前僅支援文字作文，未來將新增圖片 OCR 功能）

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

### 2. 本地開發環境設定

在專案根目錄建立 `.env.local` 檔案（如果不存在）：

```bash
# DeepSeek AI API Key（用於作文批改）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**替換說明**：
- 將 `your_deepseek_api_key_here` 替換為您實際的 DeepSeek API Key

### 3. Vercel 生產環境設定

#### 方法一：透過 Vercel Dashboard

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案
3. 進入 **Settings** → **Environment Variables**
4. 新增環境變數：
   - **Name**: `DEEPSEEK_API_KEY`
   - **Value**: 您的 DeepSeek API Key
   - **Environments**: 勾選 `Production`, `Preview`, `Development`
5. 點擊 **Save**
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

### 4. 驗證設定

在專案部署完成後：

1. 登入管理員介面
2. 進入 **作文管理** → 選擇任一文字作文
3. 切換至「編輯評分」分頁
4. 點擊「🌟 AI 輔助批改」按鈕
5. 等待 AI 分析完成（約 5-10 秒）
6. 查看 AI 建議的評分和評語

如果出現錯誤訊息「DeepSeek API Key 未設定」，請檢查環境變數是否正確設定。

## 使用方式

### 管理員批改流程

1. **進入批改頁面**
   - 路徑：`/admin/essays/[id]/edit`
   - 選擇要批改的作文

2. **使用 AI 輔助批改**（僅支援文字作文）
   - 切換至「編輯評分」分頁
   - 點擊「🌟 AI 輔助批改」按鈕
   - AI 會自動分析作文內容

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

DeepSeek V3 API 定價（2025 年資料）：
- **輸入**：$0.27 / 百萬 tokens
- **輸出**：$1.10 / 百萬 tokens
- **預估成本**：每篇作文約 $0.0007（不到 0.1 元台幣）

**範例計算**（500 字作文）：
- 輸入：約 800 tokens（作文 + 提示詞）
- 輸出：約 300 tokens（評分 + 評語）
- 總成本：約 $0.00055

## 限制與注意事項

### 目前支援
- ✅ 文字作文自動批改
- ✅ 繁體中文評語
- ✅ 5 項評分指標
- ✅ 教師可調整 AI 建議

### 暫不支援（未來規劃）
- ❌ 圖片作文 OCR 辨識（規劃中）
- ❌ 手寫英文自動辨識（規劃中）

### 最佳實務
- AI 建議僅供參考，教師應依教學經驗調整
- 複雜或特殊主題的作文建議人工批改
- 定期檢查 API 用量，避免超出預算

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

### 問題 3：按鈕顯示為灰色無法點擊

**原因**：
- 作文類型為圖片（目前不支援）
- 作文內容為空

**解決方法**：
- 確認作文類型為「文字」
- 確認作文有實際內容

## 技術架構

### API 端點
- **路徑**：`/api/essays/ai-grade`
- **方法**：POST
- **參數**：
  ```json
  {
    "essay_content": "作文內容",
    "essay_title": "作文標題（選填）",
    "essay_topic": "作文題目（選填）"
  }
  ```

### 前端元件
- **檔案**：`/src/app/admin/essays/[id]/edit/page.tsx`
- **AI 按鈕位置**：「編輯評分」分頁頂部

### 相關檔案
```
/src/app/api/essays/ai-grade/route.ts  # AI 批改 API
/src/app/admin/essays/[id]/edit/page.tsx  # 管理員批改頁面
AI_GRADING_SETUP.md  # 本設定文檔
```

## 未來功能規劃

### 階段 2：圖片作文 OCR 批改
- 使用 Google Cloud Vision API 辨識手寫英文
- 自動將圖片轉換為文字後批改
- 預估成本：每篇 3 張圖片約 $0.005

### 階段 3：批改歷史追蹤
- 記錄每次 AI 批改的結果
- 比對教師調整前後的差異
- 用於改進 AI 批改準確度

## 技術支援

如有任何問題，請聯絡系統管理員或參考：
- [DeepSeek API 文檔](https://platform.deepseek.com/docs)
- [Vercel 環境變數文檔](https://vercel.com/docs/environment-variables)

---

**最後更新**：2025-01-11
**版本**：1.0.0（文字作文批改）
