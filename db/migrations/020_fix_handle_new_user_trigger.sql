-- 020_fix_handle_new_user_trigger.sql
-- 修復新使用者註冊時 "Database error saving new user" 錯誤
--
-- 原因：public.users 的 email 欄位有 UNIQUE 約束。
-- 當使用者被刪除後重新註冊（或 auth.users 記錄被清除），
-- trigger 的 ON CONFLICT (id) 無法處理 email 衝突，導致 500 錯誤。
--
-- 修復：
-- 1. 插入前先清除同 email 但不同 id 的舊記錄
-- 2. 加入 EXCEPTION 處理，確保 trigger 失敗不會阻擋使用者註冊

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 清除可能存在的同 email 舊記錄（使用者被刪除後重新註冊的情況）
  DELETE FROM public.users WHERE email = NEW.email AND id != NEW.id;

  INSERT INTO public.users (id, email, full_name, role, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student',
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 記錄錯誤但不阻擋使用者註冊
  RAISE WARNING 'handle_new_user() failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 確保 trigger 存在
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
