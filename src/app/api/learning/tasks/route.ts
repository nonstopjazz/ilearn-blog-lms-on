import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET - 取得學生任務列表
export async function GET(request: NextRequest) {
  try {
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
      console.error('[Learning Tasks API] Query error:', error);
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

    // 計算每日任務的連續天數（取最高的 daily_streak）
    const maxStreak = tasks
      .filter(t => t.task_type === 'daily')
      .reduce((max, t) => Math.max(max, t.daily_streak || 0), 0);

    return NextResponse.json({
      success: true,
      data: tasks,
      stats: {
        ...stats,
        max_streak: maxStreak
      }
    });

  } catch (error: any) {
    console.error('[Learning Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
