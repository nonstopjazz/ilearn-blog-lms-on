-- 017_setup_essay_storage.sql
-- 設置作文圖片 Storage 的 RLS 政策

-- 注意：Supabase Storage bucket 需要在 Supabase Dashboard 中手動建立
-- Bucket 名稱：essays
-- Public：false
-- File size limit：50MB
-- Allowed MIME types：image/jpeg, image/png, image/heic

-- Storage RLS 政策：允許學生上傳到自己的資料夾
CREATE POLICY "Students can upload own essays"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'essays' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS 政策：允許學生讀取自己的檔案
CREATE POLICY "Students can view own essay files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'essays' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS 政策：允許學生更新自己的檔案
CREATE POLICY "Students can update own essay files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'essays' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'essays' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS 政策：允許學生刪除自己的檔案
CREATE POLICY "Students can delete own essay files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'essays' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS 政策：管理員可以讀取所有檔案
CREATE POLICY "Admins can view all essay files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'essays' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Storage RLS 政策：管理員可以更新所有檔案
CREATE POLICY "Admins can update all essay files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'essays' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'essays' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Storage RLS 政策：管理員可以刪除所有檔案
CREATE POLICY "Admins can delete all essay files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'essays' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 註解說明
COMMENT ON POLICY "Students can upload own essays" ON storage.objects IS '學生只能上傳到自己的資料夾';
COMMENT ON POLICY "Students can view own essay files" ON storage.objects IS '學生只能查看自己的作文圖片';
COMMENT ON POLICY "Admins can view all essay files" ON storage.objects IS '管理員可以查看所有學生的作文圖片';
