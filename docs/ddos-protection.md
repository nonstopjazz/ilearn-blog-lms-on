# DDoS 和暴力破解防護指南

## 🛡️ 已實施的防護機制

### 1. 速率限制 (Rate Limiting)
- **登入嘗試限制**: 15分鐘內最多5次失敗嘗試
- **API 請求限制**: 15分鐘內最多100次請求
- **註冊限制**: 每小時最多3次註冊嘗試
- **自動封鎖**: 失敗次數過多時自動封鎖30分鐘

### 2. 驗證碼保護 (CAPTCHA)
- **觸發條件**: 登入失敗3次後自動啟用
- **圖形驗證碼**: 包含干擾線和噪點的圖形驗證碼
- **自動刷新**: 支持手動刷新驗證碼
- **即時驗證**: 輸入完成後即時檢查正確性

### 3. IP 封鎖機制
- **自動檢測**: 檢測可疑活動模式
- **手動封鎖**: 管理員可手動封鎖特定 IP
- **黑名單管理**: 維護可疑 IP 黑名單
- **自動解除**: 支持自動或手動解除封鎖

### 4. 安全監控
- **即時日誌**: 記錄所有安全相關事件
- **異常檢測**: 自動檢測異常活動模式
- **統計分析**: 提供詳細的安全統計資料
- **管理介面**: 專用的安全管理後台

## 🔒 防護層級

### 第一層：網路層防護
```
客戶端 → 中間件 (middleware.ts) → 速率限制檢查
```
- 檢查 IP 是否在黑名單
- 驗證請求頻率
- 記錄安全事件

### 第二層：應用層防護
```
登入表單 → 驗證碼檢查 → 認證處理
```
- 多次失敗後要求驗證碼
- 密碼強度檢查
- 會話安全管理

### 第三層：資料庫層防護
```
認證 API → 用戶驗證 → 安全日誌記錄
```
- 安全的密碼存儲
- 嘗試記錄追蹤
- 異常活動警報

## ⚙️ 配置選項

### 速率限制配置 (`src/lib/rate-limiter.ts`)
```typescript
const RATE_LIMIT_CONFIG = {
  LOGIN_ATTEMPTS: {
    maxAttempts: 5,           // 最大嘗試次數
    windowMs: 15 * 60 * 1000, // 時間窗口 (15分鐘)
    lockoutMs: 30 * 60 * 1000 // 封鎖時間 (30分鐘)
  },
  API_REQUESTS: {
    maxRequests: 100,         // 最大請求數
    windowMs: 15 * 60 * 1000  // 時間窗口
  }
};
```

### 中間件配置 (`src/middleware.ts`)
```typescript
const RATE_LIMITED_PATHS = {
  '/api/auth': 'LOGIN_ATTEMPTS',
  '/auth': 'LOGIN_ATTEMPTS',
  '/api/quiz/upload': 'API_REQUESTS',
  '/api/admin': 'API_REQUESTS'
};
```

## 📊 安全監控

### 管理員安全後台
路徑: `/admin/security`

**功能包含:**
- 即時安全統計
- 可疑 IP 管理
- 安全日誌查看
- 手動 IP 封鎖/解封

### 監控指標
- 可疑 IP 數量
- 活躍速率限制
- 24小時請求統計
- 失敗登入次數

## 🚀 進階防護建議

### 1. 雲端防護服務
```bash
# 建議使用的服務
- Cloudflare DDoS Protection
- AWS Shield
- Azure DDoS Protection
```

### 2. 反向代理配置
```nginx
# Nginx 配置範例
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

location /api/auth {
    limit_req zone=login burst=5 nodelay;
}

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

### 3. 資料庫優化
```sql
-- 索引優化
CREATE INDEX idx_security_logs_ip_timestamp ON security_logs(ip, timestamp);
CREATE INDEX idx_rate_limits_key_reset_time ON rate_limits(key, reset_time);
```

### 4. 監控和警報
```javascript
// 設置自動警報
const ALERT_THRESHOLDS = {
  suspiciousIPs: 10,        // 可疑 IP 超過10個
  failedLoginsPerHour: 100, // 每小時失敗登入超過100次
  blockedRequests: 1000     // 封鎖請求超過1000次
};
```

## 🔧 部署注意事項

### 1. 環境變數
```bash
# .env.local
RATE_LIMIT_MEMORY_STORE=true  # 開發環境使用記憶體存儲
REDIS_URL=redis://localhost:6379  # 生產環境使用 Redis
SECURITY_LOG_LEVEL=info
```

### 2. 生產環境優化
- 使用 Redis 替代記憶體存儲
- 設置日誌輪轉
- 啟用 HTTPS
- 配置安全標頭

### 3. 性能考量
- 定期清理過期記錄
- 優化安全日誌查詢
- 監控記憶體使用量
- 設置合理的限制閾值

## 🧪 測試方法

### 1. 速率限制測試
```bash
# 使用 curl 測試登入限制
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "嘗試 $i"
done
```

### 2. 驗證碼測試
1. 故意輸入錯誤密碼3次
2. 確認驗證碼出現
3. 測試驗證碼驗證功能

### 3. IP 封鎖測試
1. 觸發速率限制
2. 檢查 IP 是否被自動封鎖
3. 測試管理員解封功能

## 📈 監控建議

### 1. 關鍵指標
- 登入成功率
- 平均響應時間
- 被封鎖的請求數
- 驗證碼使用頻率

### 2. 警報設置
- 可疑活動激增
- 系統響應時間過長
- 記憶體使用量過高
- 錯誤率超過閾值

### 3. 日誌分析
- 分析攻擊模式
- 識別常見攻擊來源
- 優化防護規則
- 調整限制參數

## 🆘 緊急應對

### 1. 遭受攻擊時
```bash
# 臨時封鎖所有非白名單 IP
# 在 rate-limiter.ts 中調整參數
const EMERGENCY_MODE = {
  maxAttempts: 1,
  windowMs: 60 * 60 * 1000,  // 1小時
  lockoutMs: 24 * 60 * 60 * 1000  // 24小時
};
```

### 2. 恢復程序
1. 分析攻擊日誌
2. 更新防護規則
3. 逐步放寬限制
4. 監控系統恢復

## 📞 支援聯絡

如需技術支援或發現安全問題，請聯繫系統管理員。