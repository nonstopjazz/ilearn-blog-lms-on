# 修復作文提交外鍵錯誤

## 🚨 問題描述

錯誤訊息：
```
insert or update on table "essay_submission" violates foreign key constraint "essay_submission_student_id_fkey"
```

## 🔍 問題分析

**根本原因**：
- `essay_submissions` 表的 `student_id` 外鍵引用 `public.users` 表
- 但用戶註冊時，系統只在 `auth.users` 和 `profiles` 表中創建記錄
- **沒有在 `public.users` 表中創建對應記錄**
- 導致學生提交作文時，外鍵約束檢查失敗

## ✅ 解決方案

執行 Migration 019，它會：
1. **同步現有用戶**：將所有 `auth.users` 中的用戶同步到 `public.users`
2. **創建自動觸發器**：未來新註冊用戶自動同步到 `public.users`
3. **創建 profile 同步**：當 profile 更新時，同步 role 到 `users` 表

## 📋 執行步驟

### 方法 1：在 Supabase Dashboard 執行（推薦）

1. **前往 Supabase Dashboard**
   - 訪問：https://app.supabase.com/project/ytzspnjmkvrkbztnaomm
   - 點擊左側 **SQL Editor**

2. **執行 Migration SQL**
   - 點擊 **"New Query"**
   - 複製 `/db/migrations/019_sync_auth_users_to_public_users.sql` 的內容
   - 貼上到編輯器
   - 點擊 **"Run"** 執行

3. **驗證結果**
   - 檢查是否有錯誤訊息
   - 查詢 `public.users` 表確認用戶已同步：
     ```sql
     SELECT id, email, role FROM public.users;
     ```

### 方法 2：使用 Supabase CLI（進階）

```bash
# 如果已安裝 Supabase CLI
supabase db push

# 或手動執行 migration
supabase db execute --file db/migrations/019_sync_auth_users_to_public_users.sql
```

## 🎯 Migration 內容說明

### 步驟 1：同步現有用戶
將所有已註冊但還沒在 `public.users` 中的用戶添加進去。

### 步驟 2：創建自動同步觸發器
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
當新用戶註冊時，自動在 `public.users` 創建對應記錄。

### 步驟 3：創建 Profile 同步觸發器
```sql
CREATE TRIGGER on_profile_updated
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_users();
```
當 profile 更新時，同步 role 和 full_name 到 users 表。

## 🔍 驗證修復

執行完 migration 後，測試作文提交：

1. **登入學生帳號**
2. **上傳作文**
3. **應該不再出現外鍵錯誤**

如果仍然出現錯誤，檢查：

```sql
-- 1. 檢查學生ID是否在users表中
SELECT id, email, role FROM public.users WHERE id = '學生的UUID';

-- 2. 如果找不到，手動添加
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'student'
FROM auth.users
WHERE id = '學生的UUID';
```

## 📝 未來預防

這個修復後：
- ✅ 新用戶註冊時會自動同步到 `public.users`
- ✅ Profile 更新時會自動同步 role
- ✅ 作文提交不再出現外鍵錯誤

## 🐛 如果問題依然存在

請檢查：
1. Migration 是否成功執行
2. 觸發器是否正確創建
3. 學生帳號是否在 `public.users` 中

執行診斷查詢：
```sql
-- 列出所有觸發器
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 檢查 users 表數量
SELECT COUNT(*) FROM public.users;
SELECT COUNT(*) FROM auth.users;

-- 找出不同步的用戶
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```
