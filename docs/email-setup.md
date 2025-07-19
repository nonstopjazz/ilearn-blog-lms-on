# Email 設定指南

## 問題診斷

如果註冊後沒有收到確認信，可能是以下原因：

### 1. Resend API 限制
- 免費帳戶每月只能發送 100 封信
- 只能從驗證過的網域發送
- `onboarding@resend.dev` 是測試用信箱

### 2. Supabase Email 設定
Supabase 預設使用自己的 email 服務，不需要額外設定。

## 解決方案

### 方案一：使用 Supabase 預設 Email（推薦）

1. **移除自訂 Email 設定**
   - 在 Supabase Dashboard → Authentication → Email Templates
   - 確保 "Enable Custom SMTP" 是關閉的

2. **檢查 Email 模板**
   - Confirm signup: 用於註冊確認
   - Magic Link: 用於無密碼登入
   - Change Email Address: 用於更改信箱

3. **測試方法**
   ```sql
   -- 在 Supabase SQL Editor 執行
   SELECT email, confirmed_at, confirmation_sent_at 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### 方案二：設定 Resend SMTP

1. **在 Resend Dashboard 設定**
   - 登入 https://resend.com
   - 添加並驗證您的網域
   - 獲取 SMTP 設定

2. **在 Supabase 設定 SMTP**
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: 您的 API Key
   Sender Email: noreply@您的網域.com
   ```

### 方案三：開發環境解決方案

1. **手動確認用戶**
   在 Supabase SQL Editor 執行：
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = now(), 
       confirmed_at = now() 
   WHERE email = '您的信箱@example.com';
   ```

2. **使用 Inbucket（本地測試）**
   - 在 Supabase 本地開發環境
   - Email 會顯示在 http://localhost:54324/

## 檢查清單

- [ ] Vercel 環境變數是否正確設定
- [ ] Supabase Email Templates 是否啟用
- [ ] 垃圾郵件資料夾
- [ ] Email 是否輸入正確
- [ ] Resend API 配額是否用完

## 建議

對於生產環境，建議：
1. 使用您自己的網域 Email
2. 設定 SPF、DKIM、DMARC 記錄
3. 使用專業的 Email 服務（SendGrid、AWS SES 等）