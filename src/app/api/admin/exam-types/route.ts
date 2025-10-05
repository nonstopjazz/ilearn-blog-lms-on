import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// 定義考試類型介面
interface ExamType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

// GET - 取得所有考試類型
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('exam_types')
      .select('*')
      .order('order_index', { ascending: true });

    // 如果只要啟用的類型
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Exam Types API] Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[Exam Types API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 新增考試類型
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabase();

    // 驗證必填欄位
    if (!body.name || !body.display_name || !body.color) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, display_name, color' },
        { status: 400 }
      );
    }

    // 檢查名稱是否已存在
    const { data: existing } = await supabase
      .from('exam_types')
      .select('id')
      .eq('name', body.name)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Exam type with this name already exists' },
        { status: 409 }
      );
    }

    // 新增記錄
    const { data, error } = await supabase
      .from('exam_types')
      .insert([{
        name: body.name,
        display_name: body.display_name,
        description: body.description || null,
        color: body.color,
        icon: body.icon || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        order_index: body.order_index || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('[Exam Types API] Insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Exam type created successfully'
    });

  } catch (error) {
    console.error('[Exam Types API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - 更新考試類型
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabase();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Exam type ID is required' },
        { status: 400 }
      );
    }

    // 準備更新資料
    const updateData: any = {};
    const allowedFields = [
      'display_name', 'description', 'color', 'icon',
      'is_active', 'order_index'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // 如果要更新 name，檢查是否重複
    if (body.name) {
      const { data: existing } = await supabase
        .from('exam_types')
        .select('id')
        .eq('name', body.name)
        .neq('id', body.id)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Exam type with this name already exists' },
          { status: 409 }
        );
      }
      updateData.name = body.name;
    }

    // 更新記錄
    const { data, error } = await supabase
      .from('exam_types')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('[Exam Types API] Update error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Exam type updated successfully'
    });

  } catch (error) {
    console.error('[Exam Types API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 刪除考試類型
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exam type ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 檢查是否有考試記錄使用此類型
    const { data: examRecords } = await supabase
      .from('exam_records')
      .select('id')
      .limit(1);

    // 注意：因為 exam_records.exam_type 是字串而非外鍵
    // 所以無法直接檢查關聯，這裡先允許刪除
    // 未來如果改成外鍵關聯，需要加上檢查邏輯

    const { error } = await supabase
      .from('exam_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Exam Types API] Delete error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exam type deleted successfully'
    });

  } catch (error) {
    console.error('[Exam Types API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
