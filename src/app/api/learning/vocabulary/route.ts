import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAuthUserFromCookies } from '@/lib/api-auth';
import { isAdmin } from '@/lib/security-config';
import type { VocabularySession, ApiResponse } from '@/types/learning-management';

// GET - 取得單字學習記錄
export async function GET(request: NextRequest) {
  try {
    // Cookie 認證
    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    const student_id = searchParams.get('student_id');
    // IDOR 防護：只允許查看自己的資料，除非是管理員
    const effectiveStudentId = student_id && student_id !== authUser.id && isAdmin(authUser)
      ? student_id
      : authUser.id;
    const course_id = searchParams.get('course_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('vocabulary_sessions')
      .select('*')
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1);

    query = query.eq('student_id', effectiveStudentId);
    if (course_id) {
      query = query.eq('course_id', course_id);
    }
    if (date_from) {
      query = query.gte('session_date', date_from);
    }
    if (date_to) {
      query = query.lte('session_date', date_to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Vocabulary API] Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 計算統計資料
    const stats = data ? {
      total_sessions: data.length,
      total_words_learned: data.reduce((sum, session) => sum + (session.words_learned || 0), 0),
      average_accuracy: data.reduce((sum, session) => sum + (session.accuracy_rate || 0), 0) / (data.length || 1),
      total_duration_minutes: data.reduce((sum, session) => sum + (session.session_duration || 0), 0)
    } : null;

    return NextResponse.json({
      success: true,
      data: data,
      stats: stats,
      pagination: {
        total: count,
        offset: offset,
        limit: limit
      }
    } as ApiResponse<VocabularySession[]>);

  } catch (error) {
    console.error('[Vocabulary API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 新增單字學習記錄
export async function POST(request: NextRequest) {
  try {
    // Cookie 認證
    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = getSupabase();

    // IDOR 防護：只允許操作自己的資料，除非是管理員
    const effectiveStudentId = body.student_id && body.student_id !== authUser.id && isAdmin(authUser)
      ? body.student_id
      : authUser.id;

    // 驗證必填欄位
    if (!body.course_id || !body.session_date ||
        body.start_number === undefined || body.end_number === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 檢查是否已有相同日期的記錄
    const { data: existing } = await supabase
      .from('vocabulary_sessions')
      .select('id')
      .eq('student_id', effectiveStudentId)
      .eq('course_id', body.course_id)
      .eq('session_date', body.session_date)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Session already exists for this date' },
        { status: 409 }
      );
    }

    // 新增記錄
    const { data, error } = await supabase
      .from('vocabulary_sessions')
      .insert([{
        student_id: effectiveStudentId,
        course_id: body.course_id,
        session_date: body.session_date,
        start_number: body.start_number,
        end_number: body.end_number,
        session_duration: body.session_duration,
        accuracy_rate: body.accuracy_rate,
        review_count: body.review_count || 0,
        notes: body.notes,
        status: body.status || 'completed',
        parent_verified: body.parent_verified || false
      }])
      .select()
      .single();

    if (error) {
      console.error('[Vocabulary API] Insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Vocabulary session created successfully'
    } as ApiResponse<VocabularySession>);

  } catch (error) {
    console.error('[Vocabulary API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - 更新單字學習記錄
export async function PUT(request: NextRequest) {
  try {
    // Cookie 認證
    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = getSupabase();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // 準備更新資料
    const updateData: any = {};
    const allowedFields = [
      'end_number', 'session_duration', 'accuracy_rate',
      'review_count', 'notes', 'status', 'parent_verified'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // 更新記錄
    const { data, error } = await supabase
      .from('vocabulary_sessions')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('[Vocabulary API] Update error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Vocabulary session updated successfully'
    } as ApiResponse<VocabularySession>);

  } catch (error) {
    console.error('[Vocabulary API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 刪除單字學習記錄
export async function DELETE(request: NextRequest) {
  try {
    // Cookie 認證
    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('vocabulary_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Vocabulary API] Delete error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vocabulary session deleted successfully'
    });

  } catch (error) {
    console.error('[Vocabulary API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}