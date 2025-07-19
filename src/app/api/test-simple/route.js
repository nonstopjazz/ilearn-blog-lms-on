import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '測試 API 正常運作',
    env: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasFromEmail: !!process.env.FROM_EMAIL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
    }
  });
}