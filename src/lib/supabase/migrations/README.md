# Blog 資料庫遷移指南

## 執行 Migration

請在 Supabase Dashboard 中執行以下步驟：

1. 登入您的 Supabase 專案
2. 前往 SQL Editor
3. 複製 `001_create_blog_tables.sql` 的內容
4. 貼上並執行

## 資料表說明

### blog_categories
- 儲存部落格分類
- 包含文章計數自動更新功能

### blog_tags  
- 儲存部落格標籤
- 支援多對多關聯

### blog_posts
- 儲存部落格文章
- 支援分類和多個標籤

### blog_post_tags
- 文章和標籤的關聯表
- 支援一篇文章有多個標籤

## 注意事項

- 執行前請確認是否已有同名資料表
- 如果有舊資料需要遷移，請先備份
- 觸發器會自動維護分類的文章數量