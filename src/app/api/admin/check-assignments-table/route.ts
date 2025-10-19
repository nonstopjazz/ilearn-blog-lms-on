import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // 檢查 assignments 表是否存在
    const tableExistsQuery = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'assignments'
      );
    `;

    const tableExists = tableExistsQuery.rows[0].exists;

    if (!tableExists) {
      return NextResponse.json({
        success: false,
        error: 'assignments 表不存在',
        tableExists: false
      });
    }

    // 查詢表結構
    const columnsQuery = await sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'assignments'
      ORDER BY ordinal_position;
    `;

    // 查詢外鍵約束
    const constraintsQuery = await sql`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'assignments'
        AND tc.constraint_type = 'FOREIGN KEY';
    `;

    // 查詢現有記錄數
    const countQuery = await sql`
      SELECT COUNT(*) as count FROM assignments;
    `;

    // 查詢最近的 5 筆記錄
    const recentQuery = await sql`
      SELECT id, title, created_at, course_id, lesson_id
      FROM assignments
      ORDER BY created_at DESC
      LIMIT 5;
    `;

    return NextResponse.json({
      success: true,
      tableExists: true,
      columns: columnsQuery.rows,
      foreignKeys: constraintsQuery.rows,
      totalRecords: countQuery.rows[0].count,
      recentRecords: recentQuery.rows
    });

  } catch (error) {
    console.error('檢查 assignments 表錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
