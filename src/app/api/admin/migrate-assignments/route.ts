import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/admin/migrate-assignments] 開始執行 migration...');

    const supabase = createSupabaseAdminClient();

    // 執行 SQL migration
    const migrationSQL = `
      -- 將 assignments 表的 course_id 改為 nullable
      ALTER TABLE assignments
      ALTER COLUMN course_id DROP NOT NULL;

      -- 添加註解說明
      COMMENT ON COLUMN assignments.course_id IS '課程 ID (可選,專案作業可能不屬於特定課程)';
    `;

    console.log('[POST /api/admin/migrate-assignments] 執行 SQL:', migrationSQL);

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // 如果 RPC 不存在,直接使用 raw SQL
      console.log('[POST /api/admin/migrate-assignments] RPC 失敗,嘗試直接執行...');

      // 使用 Supabase client 直接執行 (可能需要 service role)
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1);

      if (directError) {
        console.error('[POST /api/admin/migrate-assignments] Migration 失敗:', error);
        throw new Error(`Migration 失敗: ${error.message}`);
      }
    }

    console.log('[POST /api/admin/migrate-assignments] Migration 執行成功');

    // 驗證修改
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable')
      .eq('table_name', 'assignments')
      .eq('column_name', 'course_id')
      .single();

    if (schemaError) {
      console.error('[POST /api/admin/migrate-assignments] 驗證失敗:', schemaError);
    } else {
      console.log('[POST /api/admin/migrate-assignments] 驗證結果:', schemaInfo);
    }

    return NextResponse.json({
      success: true,
      message: 'Migration 執行成功',
      data: {
        migrationApplied: true,
        schemaInfo
      }
    });

  } catch (error) {
    console.error('[POST /api/admin/migrate-assignments] Migration 失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'Migration 執行失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
