-- 019_sync_auth_users_to_public_users.sql
-- 修復外鍵約束問題：自動同步 auth.users 到 public.users

-- 步驟 1：將現有的 auth.users 同步到 public.users
-- 這會處理已經註冊但還沒有在 public.users 中的用戶
INSERT INTO public.users (id, email, full_name, role, is_admin, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email), -- 從 metadata 或使用email
  COALESCE(p.role, 'student'), -- 從 profiles 獲取 role，預設為 student
  FALSE, -- 預設不是管理員
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 步驟 2：創建觸發器函數，在 auth.users 插入新用戶時自動同步到 public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student', -- 預設角色為學生
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步驟 3：創建觸發器（如果不存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 步驟 4：創建觸發器來同步 profiles 的 role 更新到 users
CREATE OR REPLACE FUNCTION public.sync_profile_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- 當 profiles 更新時，同步 role 到 users 表
  UPDATE public.users
  SET
    role = NEW.role,
    full_name = COALESCE(NEW.full_name, users.full_name)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_users();

-- 註解
COMMENT ON FUNCTION public.handle_new_user() IS '當 auth.users 新增用戶時，自動同步到 public.users';
COMMENT ON FUNCTION public.sync_profile_to_users() IS '當 profiles 更新時，同步 role 和 full_name 到 public.users';
