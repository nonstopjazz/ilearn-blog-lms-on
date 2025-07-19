import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 創建訂單
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { course_id, course_title, user_id, amount, payment_method, user_info } = body;

    // 驗證必要欄位
    if (!course_id || !user_id || !payment_method || !user_info) {
      return NextResponse.json(
        { error: '缺少必要的訂單資訊' },
        { status: 400 }
      );
    }

    // 課程資訊 - 優先使用傳入的標題，否則查資料庫
    let finalCourseTitle = course_title;
    
    if (!finalCourseTitle) {
      const { data: dbCourse } = await supabase
        .from('courses')
        .select('title')
        .eq('id', course_id)
        .single();
      
      finalCourseTitle = dbCourse?.title || '課程';
    }

    // 生成訂單編號
    const orderNumber = `ORDER${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // 創建訂單記錄
    const orderData = {
      order_number: orderNumber,
      user_id: user_id,
      course_id: course_id,
      course_title: finalCourseTitle,
      amount: amount,
      status: 'pending',
      payment_method: payment_method,
      user_info: user_info,
      created_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('創建訂單失敗:', orderError);
      return NextResponse.json(
        { error: '創建訂單失敗' },
        { status: 500 }
      );
    }

    // 如果是免費課程，直接給予權限
    if (amount === 0) {
      const { error: accessError } = await supabase
        .from('user_course_access')
        .insert({
          user_id: user_id,
          course_id: course_id,
          order_id: order.id,
          access_type: 'purchased',
          granted_at: new Date().toISOString(),
        });

      if (accessError) {
        console.error('授予課程權限失敗:', accessError);
      }

      // 更新訂單狀態為已完成
      await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', order.id);
    }

    return NextResponse.json({
      success: true,
      order: order,
      message: amount === 0 ? '免費課程註冊成功' : '訂單創建成功'
    });

  } catch (error) {
    console.error('訂單 API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}

// 獲取用戶訂單
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const orderId = searchParams.get('order_id');

    if (!userId && !orderId) {
      return NextResponse.json(
        { error: '需要提供 user_id 或 order_id' },
        { status: 400 }
      );
    }

    let query = supabase.from('orders').select('*');

    if (orderId) {
      query = query.eq('id', orderId);
    } else if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false });
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('獲取訂單失敗:', error);
      return NextResponse.json(
        { error: '獲取訂單失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || []
    });

  } catch (error) {
    console.error('獲取訂單 API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}

// 更新訂單狀態
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { order_id, status, payment_info } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: '缺少訂單ID或狀態' },
        { status: 400 }
      );
    }

    // 更新訂單
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (payment_info) {
      updateData.payment_info = payment_info;
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error('更新訂單失敗:', error);
      return NextResponse.json(
        { error: '更新訂單失敗' },
        { status: 500 }
      );
    }

    // 如果訂單完成，給予課程權限
    if (status === 'completed') {
      const { error: accessError } = await supabase
        .from('user_course_access')
        .upsert({
          user_id: order.user_id,
          course_id: order.course_id,
          order_id: order.id,
          access_type: 'purchased',
          granted_at: new Date().toISOString(),
        });

      if (accessError) {
        console.error('授予課程權限失敗:', accessError);
      }
    }

    return NextResponse.json({
      success: true,
      order: order,
      message: '訂單狀態更新成功'
    });

  } catch (error) {
    console.error('更新訂單 API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}