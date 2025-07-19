# Vercel 環境變數設定指南

請在 Vercel Dashboard > Settings > Environment Variables 中添加以下變數：

## 必要環境變數

### Supabase (必要)
```
NEXT_PUBLIC_SUPABASE_URL=https://ytzspnjmkvrkbztnaomm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0enNwbmpta3Zya2J6dG5hb21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDE3ODIsImV4cCI6MjA2Nzc3Nzc4Mn0.8eoYKSTT8p5ghFlfahsNjFslxTo7dbSvJylCY0_S8s8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0enNwbmpta3Zya2J6dG5hb21tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIwMTc4MiwiZXhwIjoyMDY3Nzc3NzgyfQ.RKVWkzKLfpzKVQzB-UqKxDbo6R_9Rn_a96bvedkwME0
```

### Email 服務 (Resend)
```
RESEND_API_KEY=re_16sqXxPH_8aFM26gPMTzDcc6EbWXo6KJ1
FROM_EMAIL=onboarding@resend.dev
FROM_NAME=iLearn 線上課程平台
```

### Bunny CDN (影片服務)
```
BUNNY_API_KEY=34eda83f-6c93-47ef-9c74d93f26fa-cb14-4ba7
BUNNY_LIBRARY_ID=467399
BUNNY_CDN_HOSTNAME=vz-a6d0df2a-1de.b-cdn.net
BUNNY_TEST_VIDEO_ID=2764c2d9-d41b-44ef-9ae2-52d94495eec8
NEXT_PUBLIC_BUNNY_PULL_ZONE=vz-a6d0df2a-1de
```

### 綠界金流 (選用)
```
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
```

### 網站 URL (重要！改為您的 Vercel 網址)
```
NEXT_PUBLIC_SITE_URL=https://ilearn-blog-lms-on-git-main-nonstopjazzs-projects.vercel.app
```

## 設定步驟

1. 登入 Vercel Dashboard
2. 選擇您的專案
3. 進入 Settings → Environment Variables
4. 逐一添加上述變數
5. 點擊 "Save"
6. 重新部署專案

## 注意事項

- 確保複製時沒有多餘的空格
- `NEXT_PUBLIC_` 開頭的變數會暴露給前端，請確保不含敏感資訊
- 設定完成後需要重新部署才會生效