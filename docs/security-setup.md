# 安全設定指南

## 管理員權限設定

### 方法 1: 透過 Email 設定管理員

1. 編輯 `src/lib/security-config.ts` 檔案
2. 在 `ADMIN_EMAILS` 陣列中添加管理員 email：

```typescript
export const ADMIN_EMAILS = [
  'your-admin@yourdomain.com',
  'another-admin@yourdomain.com'
];
```

### 方法 2: 透過用戶 Metadata 設定管理員

1. 在 Supabase 認證後，更新用戶的 metadata：

```javascript
// 在用戶註冊或管理介面中執行
await supabase.auth.updateUser({
  data: {
    role: 'admin',
    is_admin: true
  }
});
```

### 方法 3: 透過環境變數設定管理員（推薦用於生產環境）

1. 在 `.env.local` 檔案中添加：

```
ADMIN_EMAILS=admin1@domain.com,admin2@domain.com
```

2. 更新 `security-config.ts`：

```typescript
export const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];
```

## 安全檢查清單

### ✅ 已實施的安全機制

- [x] 管理員路由保護 (`/admin/*`)
- [x] 認證中間件 (AuthMiddleware)
- [x] 用戶角色權限系統
- [x] API 路由保護
- [x] 自動登出未授權用戶
- [x] 用戶權限檢查
- [x] 安全的用戶選單和登出功能

### 🔒 安全功能說明

1. **路由保護**: 所有 `/admin` 路由都需要管理員權限
2. **認證檢查**: 即時檢查用戶登入狀態
3. **權限驗證**: 檢查用戶是否為管理員
4. **自動重導向**: 未授權用戶自動跳轉到登入或錯誤頁面
5. **會話監控**: 監聽認證狀態變化，自動處理登出

### ⚠️ 重要安全提醒

1. **移除範例 Email**: 
   - 確保移除所有 `admin@example.com` 等範例 email
   - 只使用真實的管理員 email

2. **生產環境設定**:
   - 使用環境變數管理管理員清單
   - 啟用 HTTPS
   - 設定適當的 CORS 政策

3. **定期檢查**:
   - 定期檢查管理員清單
   - 移除離職員工的管理員權限
   - 監控管理員登入記錄

## 如何新增管理員

### 方法 A: 修改程式碼（開發環境）

1. 編輯 `src/lib/security-config.ts`
2. 在 `ADMIN_EMAILS` 中添加新的 email
3. 重新啟動應用程式

### 方法 B: 環境變數（生產環境）

1. 更新環境變數 `ADMIN_EMAILS`
2. 重新啟動應用程式

### 方法 C: 透過 Supabase 直接設定

1. 登入 Supabase Dashboard
2. 在 Authentication > Users 中找到用戶
3. 編輯用戶的 User Metadata：
   ```json
   {
     "role": "admin",
     "is_admin": true
   }
   ```

## 測試安全機制

### 測試步驟

1. **登出狀態測試**:
   - 確保登出後無法存取 `/admin`
   - 應該重導向到登入頁面

2. **非管理員用戶測試**:
   - 以一般用戶登入
   - 嘗試存取 `/admin`
   - 應該顯示「存取被拒絕」頁面

3. **管理員用戶測試**:
   - 以管理員 email 登入
   - 應該可以正常存取所有管理功能

### 除錯工具

- 檢查瀏覽器 Console 的認證日誌
- 使用 `/api/debug/user` 檢查用戶狀態
- 檢查 Network 標籤的 API 回應

## 常見問題

### Q: 無法存取管理員區域
A: 
1. 確認您的 email 已添加到 `ADMIN_EMAILS` 清單
2. 確認已正確登入
3. 檢查瀏覽器 Console 的錯誤訊息

### Q: 登出後仍能存取管理員區域
A: 
1. 清除瀏覽器快取和 Cookies
2. 檢查認證中間件是否正確實施
3. 確認 Supabase 認證狀態同步

### Q: 如何移除管理員權限
A:
1. 從 `ADMIN_EMAILS` 清單中移除 email
2. 或在 Supabase 中更新用戶 metadata

## 聯絡資訊

如需協助設定安全機制，請聯繫系統管理員。