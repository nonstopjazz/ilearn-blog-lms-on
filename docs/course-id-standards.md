# Course ID 標準規範

## ✅ 當前狀態
**所有課程 ID 已統一為 course_xxx 格式**

### 現有課程列表：
- `course_001` - React 基礎課程
- `course_002` - JavaScript 進階  
- `course_003` - Node.js 後端開發
- `course_011` - JavaScript 完整課程
- `course_012` - HTML & CSS 基礎
- `course_013` - React 進階開發
- `course_014` - Python 數據分析
- `course_015` - UI/UX 設計基礎

## 🎯 統一標準
**所有新課程必須使用：**
```
course_XXX
```
其中 XXX 為三位數字（001-999）

## 📋 新課程創建流程
1. **查看當前最大編號**：
   ```sql
   SELECT MAX(id) FROM courses WHERE id LIKE 'course_%';
   ```

2. **使用下一個可用編號**：
   - 當前最大：course_015
   - 下一個新課程：course_016

## 🔧 開發中的使用
### URL 路由
```
✅ 正確：/courses/course_001
✅ 正確：/admin/course-settings/course_011
❌ 錯誤：/courses/1 或 /courses/uuid-format
```

### 程式碼範例
```typescript
// ✅ 正確的使用方式
const { courseId } = useParams(); // courseId = 'course_001'

const { data } = await supabase
  .from('courses')
  .select('*')
  .eq('id', courseId); // 直接使用，無需轉換
```

## 🚨 重要提醒
- **所有新對話**都必須遵循此規範
- **不再使用** UUID 或其他格式  
- **頁面開發**時直接使用 course_xxx 格式
- **資料庫查詢**無需任何 ID 轉換

## 📝 更新記錄
- 2025/07/13：完成 UUID 格式轉換為統一標準
- 所有相關表格已更新：courses, course_lessons, quiz_sets, user_lesson_progress, course_requests, orders, user_course_access