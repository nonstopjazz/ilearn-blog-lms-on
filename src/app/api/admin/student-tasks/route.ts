import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/api-auth';

// POST - 新增學生任務
export async function POST(request: NextRequest) {
  try {
    // 安全增強：API Key 驗證（可選）
    if (process.env.API_KEY) {
      const authResult = await verifyApiKey(request);
      if (!authResult.valid) {
        return NextResponse.json(
          { success: false, error: authResult.error },
          { status: 401 }
        );
      }
    } else {
      console.warn('[Student Tasks API] API_KEY not configured, skipping API key verification');
    }

    const supabase = getSupabase();
    const body = await request.json();

    const {
      student_id,
      task_description,
      task_type,
      due_date,
      category,
      priority,
      daily_total_days,
      estimated_duration
    } = body;

    // 驗證必填欄位
    if (!student_id || !task_description || !task_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 驗證任務類型
    if (!['daily', 'onetime'].includes(task_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task_type. Must be "daily" or "onetime"' },
        { status: 400 }
      );
    }

    // 準備插入資料
    const taskData: any = {
      student_id,
      task_description,
      task_type,
      assigned_date: new Date().toISOString().split('T')[0],
      status: 'assigned',
      category: category || null,
      priority: priority || 'normal',
      estimated_duration: estimated_duration || null
    };

    // 一次性任務需要截止日期
    if (task_type === 'onetime') {
      if (!due_date) {
        return NextResponse.json(
          { success: false, error: 'due_date is required for onetime tasks' },
          { status: 400 }
        );
      }
      taskData.due_date = due_date;
    }

    // 每日任務設定天數
    if (task_type === 'daily' && daily_total_days) {
      taskData.daily_total_days = daily_total_days;
    }

    // 插入任務
    const { data: task, error } = await supabase
      .from('student_tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('[Student Tasks API] Insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });

  } catch (error: any) {
    console.error('[Student Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - 取得學生任務列表
export async function GET(request: NextRequest) {
  try {
    // 安全增強：API Key 驗證（可選）
    if (process.env.API_KEY) {
      const authResult = await verifyApiKey(request);
      if (!authResult.valid) {
        return NextResponse.json(
          { success: false, error: authResult.error },
          { status: 401 }
        );
      }
    } else {
      console.warn('[Student Tasks API] API_KEY not configured, skipping API key verification');
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    const student_id = searchParams.get('student_id');
    const status = searchParams.get('status');
    const task_type = searchParams.get('task_type');

    if (!student_id) {
      return NextResponse.json(
        { success: false, error: 'student_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('student_tasks')
      .select('*')
      .eq('student_id', student_id)
      .order('assigned_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (task_type) {
      query = query.eq('task_type', task_type);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('[Student Tasks API] Query error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 計算統計資料
    const stats = {
      total: tasks.length,
      assigned: tasks.filter(t => t.status === 'assigned').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
      daily_tasks: tasks.filter(t => t.task_type === 'daily').length,
      onetime_tasks: tasks.filter(t => t.task_type === 'onetime').length
    };

    return NextResponse.json({
      success: true,
      data: tasks,
      stats
    });

  } catch (error: any) {
    console.error('[Student Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
