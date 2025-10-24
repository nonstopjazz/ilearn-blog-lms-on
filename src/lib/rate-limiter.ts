// src/lib/rate-limiter.ts
import { NextRequest } from 'next/server';

interface RateLimit {
  count: number;
  resetTime: number;
  firstAttempt: number;
  lockoutUntil?: number;
}

interface SecurityLog {
  ip: string;
  timestamp: number;
  action: string;
  success: boolean;
  userAgent?: string;
}

// 記憶體存儲（生產環境建議使用 Redis）
const rateLimits = new Map<string, RateLimit>();
const securityLogs: SecurityLog[] = [];
const suspiciousIPs = new Set<string>();

// 配置
const RATE_LIMIT_CONFIG = {
  // 登入嘗試限制
  LOGIN_ATTEMPTS: {
    maxAttempts: 5,           // 5次失敗嘗試
    windowMs: 15 * 60 * 1000, // 15分鐘窗口
    lockoutMs: 30 * 60 * 1000 // 鎖定30分鐘
  },
  
  // API 請求限制
  API_REQUESTS: {
    maxRequests: 100,         // 每15分鐘最多100次請求
    windowMs: 15 * 60 * 1000
  },
  
  // 註冊嘗試限制
  REGISTER_ATTEMPTS: {
    maxAttempts: 3,           // 每小時最多3次註冊嘗試
    windowMs: 60 * 60 * 1000
  }
};

/**
 * 獲取客戶端 IP 地址
 */
export function getClientIP(request: NextRequest): string {
  // 檢查各種可能的 IP 來源
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  // 回退到連接 IP（在本地開發中可能不準確）
  return request.ip || 'unknown';
}

/**
 * 檢查速率限制
 */
export function checkRateLimit(
  identifier: string, 
  type: keyof typeof RATE_LIMIT_CONFIG
): { allowed: boolean; resetTime?: number; remainingAttempts?: number } {
  const config = RATE_LIMIT_CONFIG[type];
  const now = Date.now();
  const key = `${type}:${identifier}`;
  
  let rateLimit = rateLimits.get(key);
  
  // 如果沒有記錄或已過期，創建新記錄
  if (!rateLimit || now > rateLimit.resetTime) {
    rateLimit = {
      count: 0,
      resetTime: now + config.windowMs,
      firstAttempt: now
    };
  }
  
  // 檢查是否在鎖定期間
  if (rateLimit.lockoutUntil && now < rateLimit.lockoutUntil) {
    return {
      allowed: false,
      resetTime: rateLimit.lockoutUntil
    };
  }
  
  // 檢查是否超過限制
  const maxLimit = type === 'LOGIN_ATTEMPTS' ? config.maxAttempts : 
                   type === 'API_REQUESTS' ? config.maxRequests : config.maxAttempts;
  
  if (rateLimit.count >= maxLimit) {
    // 如果是登入嘗試，設置鎖定時間
    if (type === 'LOGIN_ATTEMPTS') {
      rateLimit.lockoutUntil = now + RATE_LIMIT_CONFIG.LOGIN_ATTEMPTS.lockoutMs;
    }
    
    rateLimits.set(key, rateLimit);
    return {
      allowed: false,
      resetTime: rateLimit.lockoutUntil || rateLimit.resetTime,
      remainingAttempts: 0
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: maxLimit - rateLimit.count
  };
}

/**
 * 記錄請求嘗試
 */
export function recordAttempt(
  identifier: string, 
  type: keyof typeof RATE_LIMIT_CONFIG,
  success: boolean = false
): void {
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  let rateLimit = rateLimits.get(key);
  if (!rateLimit) {
    rateLimit = {
      count: 0,
      resetTime: now + RATE_LIMIT_CONFIG[type].windowMs,
      firstAttempt: now
    };
  }
  
  rateLimit.count++;
  
  // 如果登入失敗次數過多，標記為可疑 IP
  if (type === 'LOGIN_ATTEMPTS' && !success && rateLimit.count >= 3) {
    suspiciousIPs.add(identifier);
    console.warn(`可疑 IP 標記: ${identifier}, 失敗嘗試: ${rateLimit.count}`);
  }
  
  rateLimits.set(key, rateLimit);
}

/**
 * 記錄安全日誌
 */
export function logSecurityEvent(
  ip: string,
  action: string,
  success: boolean,
  userAgent?: string
): void {
  const logEntry: SecurityLog = {
    ip,
    timestamp: Date.now(),
    action,
    success,
    userAgent
  };
  
  securityLogs.push(logEntry);
  
  // 保持日誌大小在合理範圍內
  if (securityLogs.length > 10000) {
    securityLogs.splice(0, 5000);
  }
  
  // 檢測異常模式
  detectAnomalousActivity(ip, action, success);
}

/**
 * 檢測異常活動
 */
function detectAnomalousActivity(ip: string, _action: string, _success: boolean): void {
  const recentLogs = securityLogs.filter(
    log => log.ip === ip && Date.now() - log.timestamp < 5 * 60 * 1000 // 5分鐘內
  );
  
  // 檢測快速重複請求（提高閾值避免誤判）
  if (recentLogs.length > 100) {
    suspiciousIPs.add(ip);
    console.warn(`檢測到快速重複請求: ${ip}, 5分鐘內 ${recentLogs.length} 次請求`);
  }
  
  // 檢測多次失敗嘗試
  const failedAttempts = recentLogs.filter(log => !log.success && log.action === 'login');
  if (failedAttempts.length >= 5) {
    suspiciousIPs.add(ip);
    console.warn(`檢測到多次登入失敗: ${ip}, 5分鐘內 ${failedAttempts.length} 次失敗`);
  }
}

/**
 * 檢查 IP 是否被標記為可疑
 */
export function isSuspiciousIP(ip: string): boolean {
  return suspiciousIPs.has(ip);
}

/**
 * 手動封鎖 IP
 */
export function blockIP(ip: string, reason?: string): void {
  suspiciousIPs.add(ip);
  console.warn(`IP 已被手動封鎖: ${ip}, 原因: ${reason || '未指定'}`);
}

/**
 * 解除 IP 封鎖
 */
export function unblockIP(ip: string): void {
  suspiciousIPs.delete(ip);
  // 清除相關的速率限制記錄
  for (const [key] of rateLimits) {
    if (key.endsWith(`:${ip}`)) {
      rateLimits.delete(key);
    }
  }
  console.log(`IP 封鎖已解除: ${ip}`);
}

/**
 * 獲取安全統計
 */
export function getSecurityStats() {
  const now = Date.now();
  const last24h = securityLogs.filter(log => now - log.timestamp < 24 * 60 * 60 * 1000);
  const lastHour = securityLogs.filter(log => now - log.timestamp < 60 * 60 * 1000);
  
  return {
    totalSuspiciousIPs: suspiciousIPs.size,
    activeRateLimits: rateLimits.size,
    logsLast24h: last24h.length,
    logsLastHour: lastHour.length,
    failedLoginsLast24h: last24h.filter(log => log.action === 'login' && !log.success).length,
    suspiciousIPs: Array.from(suspiciousIPs),
    recentLogs: securityLogs.slice(-50).reverse()
  };
}

/**
 * 清理過期記錄
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  
  // 清理過期的速率限制記錄
  for (const [key, rateLimit] of rateLimits) {
    if (now > rateLimit.resetTime && (!rateLimit.lockoutUntil || now > rateLimit.lockoutUntil)) {
      rateLimits.delete(key);
    }
  }
  
  // 清理舊的安全日誌（保留7天）
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const validLogs = securityLogs.filter(log => log.timestamp > weekAgo);
  securityLogs.length = 0;
  securityLogs.push(...validLogs);
}

// 定期清理過期記錄
setInterval(cleanupExpiredRecords, 60 * 60 * 1000); // 每小時清理一次