import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { verifyApiKey } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyApiKey(request);
    if (!authResult.valid && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();,
        { status: 500 }
      );
    }

    const body = await request.json();
    const { course_id, title } = body;

    if (!course_id || !title) {
      return NextResponse.json(
        { success: false, error: 'course_id and title are required' },
        { status: 400 }
      );
    }

    // 插入或更新課程
    const { data, error } = await supabase
      .from('course_lessons')
      .upsert([{
        id: `${course_id}_lesson_1`,
        course_id: course_id,
        slug: course_id.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title: title
      }])
      .select()
      .single();

    if (error) {
      console.error('[Add Course API] Error:', error);
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
    console.error('[Add Course API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}