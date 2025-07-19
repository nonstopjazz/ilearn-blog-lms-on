// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  getClientIP, 
  checkRateLimit, 
  recordAttempt, 
  isSuspiciousIP, 
  logSecurityEvent 
} from '@/lib/rate-limiter';

// 需要速率限制的路徑
const RATE_LIMITED_PATHS = {
  '/api/auth': 'LOGIN_ATTEMPTS',
  '/auth': 'LOGIN_ATTEMPTS',
  '/api/quiz/upload': 'API_REQUESTS',
  '/api/admin': 'API_REQUESTS'
} as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // 排除清除 IP 的路徑
  if (pathname === '/api/security/clear-ip') {
    return NextResponse.next();
  }
  
  // 檢查是否為可疑 IP
  if (isSuspiciousIP(ip)) {
    logSecurityEvent(ip, 'blocked_request', false, userAgent);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Access denied',
        message: 'Your IP has been temporarily blocked due to suspicious activity',
        code: 'IP_BLOCKED'
      }), 
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '1800' // 30分鐘後重試
        }
      }
    );
  }
  
  // 檢查是否需要速率限制
  for (const [path, limitType] of Object.entries(RATE_LIMITED_PATHS)) {
    if (pathname.startsWith(path)) {
      const { allowed, resetTime, remainingAttempts } = checkRateLimit(ip, limitType);
      
      if (!allowed) {
        logSecurityEvent(ip, `rate_limited_${limitType.toLowerCase()}`, false, userAgent);
        
        const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 900;
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again later.`,
            retryAfter: waitTime,
            code: 'RATE_LIMITED'
          }), 
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': waitTime.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime?.toString() || ''
            }
          }
        );
      }
      
      // 添加速率限制資訊到 headers
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', remainingAttempts?.toString() || '');
      if (resetTime) {
        response.headers.set('X-RateLimit-Reset', resetTime.toString());
      }
      
      return response;
    }
  }
  
  // 記錄一般請求（僅記錄 API 和認證相關請求）
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth')) {
    logSecurityEvent(ip, 'api_request', true, userAgent);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // 需要保護的路徑
    '/api/auth/:path*',
    '/auth/:path*',
    '/api/quiz/upload/:path*',
    '/api/admin/:path*',
    // 其他敏感 API 路徑
    '/api/:path*'
  ]
};