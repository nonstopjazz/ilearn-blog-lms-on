import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/emailService';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ success: false, error: '需要提供 email' }, { status: 400 });
    }

    // 驗證 Email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Email 格式不正確' }, { status: 400 });
    }

    // 使用我們的 emailService
    const result = await sendTestEmail(email);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `測試 Email 已成功發送到 ${email}`,
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Email 發送失敗: ${result.error}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Email 發送錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '服務器錯誤',
      details: error.message
    }, { status: 500 });
  }
}