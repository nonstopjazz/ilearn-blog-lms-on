import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 測試 Resend 連接
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    return NextResponse.json({
      success: true,
      message: 'Email 服務初始化成功',
      config: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasFromEmail: !!process.env.FROM_EMAIL,
        fromEmail: process.env.FROM_EMAIL,
        fromName: process.env.FROM_NAME,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ success: false, error: '需要提供 email' }, { status: 400 });
    }

    // 測試發送簡單 Email
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: [email],
      subject: '測試 Email - iLearn',
      html: `
        <h1>測試 Email</h1>
        <p>這是一封測試郵件，如果您收到這封信，表示 Email 系統運作正常！</p>
        <p>時間: ${new Date().toLocaleString()}</p>
      `
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email 發送成功',
      data: data
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}