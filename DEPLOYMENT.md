# 部署指南 - iLearn 課程平台

## 準備工作

### 1. GitHub 設定

#### 初始化 Git 倉庫
```bash
git init
git add .
git commit -m "Initial commit: iLearn 課程平台"
```

#### 創建 GitHub 倉庫
1. 登入 [GitHub](https://github.com)
2. 點擊右上角的 "+" → "New repository"
3. 設定倉庫名稱（例如：`ilearn-blog-lms`）
4. 選擇 Private（私有）以保護您的代碼
5. 不要初始化 README、.gitignore 或 license
6. 點擊 "Create repository"

#### 推送到 GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/ilearn-blog-lms.git
git branch -M main
git push -u origin main
```

### 2. Vercel 部署

#### 連接 Vercel
1. 前往 [Vercel](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project"
4. 選擇您剛創建的 `ilearn-blog-lms` 倉庫
5. 點擊 "Import"

#### 配置環境變數
在 Vercel 的專案設定中，添加以下環境變數：

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=您的_Supabase_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=您的_Supabase_匿名金鑰
SUPABASE_SERVICE_ROLE_KEY=您的_Supabase_服務金鑰

# 綠界金流（生產環境請使用正式金鑰）
ECPAY_MERCHANT_ID=您的商店代號
ECPAY_HASH_KEY=您的金鑰
ECPAY_HASH_IV=您的向量

# 網站 URL（重要：改為您的 Vercel 網址）
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Bunny.net CDN
BUNNY_API_KEY=您的_API_金鑰
BUNNY_LIBRARY_ID=您的_Library_ID
BUNNY_CDN_HOSTNAME=您的_CDN_主機名
BUNNY_TEST_VIDEO_ID=測試影片ID
NEXT_PUBLIC_BUNNY_PULL_ZONE=您的_Pull_Zone

# Email 服務 (Resend)
RESEND_API_KEY=您的_Resend_API_金鑰
FROM_EMAIL=您的發送郵箱
FROM_NAME=iLearn 線上課程平台
```

#### 部署設定
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

點擊 "Deploy" 開始部署！

## 部署後設定

### 1. 更新 Supabase 設定

#### 允許的重定向 URL
在 Supabase Dashboard → Authentication → URL Configuration 中添加：
- `https://your-app.vercel.app/**`

#### CORS 設定
確保 API 可以從您的 Vercel 網域訪問。

### 2. 更新安全設定

編輯 `src/lib/security-config.ts`，將管理員 email 保持為：
```typescript
adminEmails: ['nonstopjazz@gmail.com']
```

### 3. 資料庫遷移

確保 Supabase 中有所有必要的表格：
- courses
- course_lessons
- user_course_access
- quiz_sets
- quiz_questions
- blog_posts
- blog_categories
- blog_tags
- user_progress
- etc.

## 常見問題

### 1. 環境變數未生效
- 在 Vercel Dashboard 中更新環境變數後，需要重新部署
- 使用 "Redeploy" 功能並勾選 "Use existing Build Cache"

### 2. API 路由 404 錯誤
- 確認所有 API 路由文件名為 `route.js` 或 `route.ts`
- 檢查路徑是否正確

### 3. 資料庫連接錯誤
- 確認 Supabase 金鑰正確
- 檢查 Supabase 專案是否暫停

### 4. 靜態資源無法載入
- 檢查 `public` 資料夾中的檔案
- 確認路徑使用 `/` 開頭

## 監控和維護

### 1. 錯誤追蹤
- 在 Vercel Dashboard 查看 Functions 標籤中的錯誤日誌
- 使用 Vercel Analytics 監控效能

### 2. 定期備份
- 定期導出 Supabase 資料
- 使用 Git tags 標記重要版本

### 3. 安全更新
- 定期更新 npm 套件
- 監控安全警報

## 本地開發到生產環境檢查清單

- [ ] 移除所有 console.log（除了必要的錯誤日誌）
- [ ] 確認沒有硬編碼的密鑰或敏感資訊
- [ ] 測試所有主要功能
- [ ] 檢查 RWD 響應式設計
- [ ] 優化圖片和資源
- [ ] 設定適當的快取策略
- [ ] 配置錯誤頁面（404、500）
- [ ] 設定 SEO meta tags

## 聯絡支援

如有問題，請參考：
- [Next.js 文檔](https://nextjs.org/docs)
- [Vercel 文檔](https://vercel.com/docs)
- [Supabase 文檔](https://supabase.com/docs)