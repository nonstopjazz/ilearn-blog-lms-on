import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 提交課程申請
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    console.log('=== 課程申請 API 開始 ===');
    
    const body = await req.json();
    console.log('收到的資料:', body);
    
    const { user_id, course_id, course_title, user_info } = body;

    // 驗證必要欄位
    if (!user_id || !course_id || !user_info) {
      console.log('驗證失敗，缺少必要資訊');
      return NextResponse.json(
        { error: '缺少必要的申請資訊' },
        { status: 400 }
      );
    }

    console.log('開始檢查重複申請...');

    // 檢查是否已經申請過 - 修正：移除錯誤的連線測試
    const { data: existingRequest, error: checkError } = await supabase
      .from('course_requests')
      .select('*')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 表示找不到記錄，這是正常的
      console.error('檢查重複申請時發生錯誤:', checkError);
      return NextResponse.json(
        { error: `檢查申請狀態失敗: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existingRequest) {
      console.log('發現重複申請:', existingRequest);
      return NextResponse.json({
        success: false,
        error: '您已經申請過此課程',
        request: existingRequest
      });
    }

    console.log('沒有重複申請，開始創建新申請...');

    // 創建申請記錄
    const requestData = {
      user_id: user_id,
      course_id: course_id,
      course_title: course_title || '課程',
      user_info: user_info,
      status: 'pending',
      requested_at: new Date().toISOString(),
    };

    console.log('準備插入的資料:', requestData);

    const { data: newRequest, error: requestError } = await supabase
      .from('course_requests')
      .insert(requestData)
      .select()
      .single();

    if (requestError) {
      console.error('創建申請失敗:', requestError);
      return NextResponse.json(
        { error: `創建申請失敗: ${requestError.message}` },
        { status: 500 }
      );
    }

    console.log('申請創建成功:', newRequest);

    // 創建通知給用戶
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id,
          title: '課程申請已提交',
          message: `您的課程「${course_title}」申請已提交，我們會儘快審核。`,
          type: 'info',
          action_url: '/my-courses',
          action_text: '查看我的課程'
        }),
      });
    } catch (notificationError) {
      console.error('創建通知失敗:', notificationError);
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: '申請提交成功，請等待審核'
    });

  } catch (error) {
    console.error('課程申請 API 錯誤:', error);
    return NextResponse.json(
      { error: `伺服器內部錯誤: ${error.message}` },
      { status: 500 }
    );
  }
}

// 查詢申請狀態
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const courseId = searchParams.get('course_id');
    const status = searchParams.get('status');

    let query = supabase.from('course_requests').select('*');

    // 如果同時提供 user_id 和 course_id，查詢特定申請
    if (userId && courseId) {
      query = query.eq('user_id', userId).eq('course_id', courseId);
      
      const { data: requestData, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 是找不到記錄的錯誤
        console.error('查詢申請失敗:', error);
        return NextResponse.json(
          { error: '查詢申請失敗' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        request: requestData || null
      });
    }

    // 查詢多個申請（用於管理員後台或用戶自己的申請）
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('requested_at', { ascending: false });

    const { data: requests, error } = await query;

    if (error) {
      console.error('查詢申請列表失敗:', error);
      return NextResponse.json(
        { error: '查詢申請列表失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: requests || []
    });

  } catch (error) {
    console.error('查詢申請 API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}

// 更新申請狀態（管理員用）
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { request_id, status, admin_note } = body;

    if (!request_id || !status) {
      return NextResponse.json(
        { error: '缺少申請ID或狀態' },
        { status: 400 }
      );
    }

    // 驗證狀態值
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '無效的狀態值' },
        { status: 400 }
      );
    }

    // 更新申請狀態
    const updateData: any = {
      status: status,
      reviewed_at: new Date().toISOString()
    };

    if (admin_note) {
      updateData.admin_note = admin_note;
    }

    const { data: updatedRequest, error } = await supabase
      .from('course_requests')
      .update(updateData)
      .eq('id', request_id)
      .select('*, user_id, course_id')
      .single();

    if (error) {
      console.error('更新申請狀態失敗:', error);
      return NextResponse.json(
        { error: '更新申請狀態失敗' },
        { status: 500 }
      );
    }

    // 如果申請通過，給予課程權限
    if (status === 'approved') {
      const { error: accessError } = await supabase
        .from('user_course_access')
        .upsert({
          user_id: updatedRequest.user_id,
          course_id: updatedRequest.course_id,
          access_type: 'approved',
          granted_at: new Date().toISOString(),
        });

      if (accessError) {
        console.error('授予課程權限失敗:', accessError);
      }

      // 發送批准通知
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: updatedRequest.user_id,
            title: '課程申請已通過！',
            message: `恭喜！您的課程「${updatedRequest.course_title}」申請已通過，現在可以開始學習了。`,
            type: 'success',
            action_url: `/courses/${updatedRequest.course_id}/learn`,
            action_text: '開始學習'
          }),
        });
      } catch (notificationError) {
        console.error('創建通知失敗:', notificationError);
      }
    }

    // 如果申請被拒絕，移除可能存在的權限
    if (status === 'rejected') {
      const { error: removeAccessError } = await supabase
        .from('user_course_access')
        .delete()
        .eq('user_id', updatedRequest.user_id)
        .eq('course_id', updatedRequest.course_id);

      if (removeAccessError) {
        console.error('移除課程權限失敗:', removeAccessError);
      }

      // 發送拒絕通知
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: updatedRequest.user_id,
            title: '課程申請未通過',
            message: `很抱歉，您的課程「${updatedRequest.course_title}」申請未通過。${admin_note ? '原因：' + admin_note : ''}`,
            type: 'error',
            action_url: '/courses',
            action_text: '瀏覽其他課程'
          }),
        });
      } catch (notificationError) {
        console.error('創建通知失敗:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `申請已${status === 'approved' ? '通過' : status === 'rejected' ? '拒絕' : '更新'}`
    });

  } catch (error) {
    console.error('更新申請 API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}