import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// PATCH - 更新學生任務
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id: taskId } = await params;

    const updateData: any = {};

    // 允許更新的欄位
    const allowedFields = [
      'status',
      'completion_date',
      'score',
      'teacher_feedback',
      'student_notes',
      'daily_streak',
      'daily_completed_days',
      'daily_completion',
      'actual_duration'
    ];

    // 只更新提供的欄位
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // 如果標記為完成,自動設定完成日期
    if (body.status === 'completed' && !body.completion_date) {
      updateData.completion_date = new Date().toISOString().split('T')[0];
    }

    const { data: task, error } = await supabase
      .from('student_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('[Student Tasks API] Update error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });

  } catch (error: any) {
    console.error('[Student Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 刪除學生任務
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id: taskId } = await params;

    const { error } = await supabase
      .from('student_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('[Student Tasks API] Delete error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error: any) {
    console.error('[Student Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
