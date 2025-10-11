import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * PATCH /api/admin/students/[id]
 * 更新學生資訊（包含家長資訊）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json();
    const { name, email, phone, parent, status } = body;

    // 1. 查詢該學生的所有課程申請記錄
    const { data: courseRequests, error: fetchError } = await supabase
      .from('course_requests')
      .select('*')
      .eq('user_id', studentId)
      .eq('status', 'approved');

    if (fetchError) {
      console.error('查詢學生資料失敗:', fetchError);
      return NextResponse.json(
        { success: false, error: '查詢學生資料失敗' },
        { status: 500 }
      );
    }

    if (!courseRequests || courseRequests.length === 0) {
      return NextResponse.json(
        { success: false, error: '找不到該學生的課程申請記錄' },
        { status: 404 }
      );
    }

    // 2. 建立新的 user_info（合併現有資訊和新資訊）
    const currentUserInfo = courseRequests[0].user_info || {};
    const updatedUserInfo = {
      ...currentUserInfo,
      name: name || currentUserInfo.name,
      email: email || currentUserInfo.email,
      phone: phone || currentUserInfo.phone || null,
      parent: parent || currentUserInfo.parent || null,
    };

    // 3. 更新所有該學生的課程申請記錄的 user_info
    const { error: updateError } = await supabase
      .from('course_requests')
      .update({ user_info: updatedUserInfo })
      .eq('user_id', studentId);

    if (updateError) {
      console.error('更新學生資訊失敗:', updateError);
      return NextResponse.json(
        { success: false, error: '更新學生資訊失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '學生資訊已更新',
      data: {
        student_id: studentId,
        user_info: updatedUserInfo,
      },
    });
  } catch (error) {
    console.error('更新學生資訊時發生錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
