// src/app/api/debug/ip/route.js
import { getClientIP } from '@/lib/rate-limiter';

export async function GET(request) {
  try {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return Response.json({
      ip,
      userAgent,
      headers: {
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'x-real-ip': request.headers.get('x-real-ip'),
        'cf-connecting-ip': request.headers.get('cf-connecting-ip')
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('IP 檢查失敗:', error);
    return Response.json({ 
      error: '無法獲取 IP 資訊',
      ip: 'unknown'
    }, { status: 500 });
  }
}