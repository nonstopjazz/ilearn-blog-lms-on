const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 直接設定環境變數（因為沒有 dotenv）
const supabaseUrl = 'https://ytzspnjmkvrkbztnaomm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0enNwbmpta3Zya2J6dG5hb21tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIwMTc4MiwiZXhwIjoyMDY3Nzc3NzgyfQ.RKVWkzKLfpzKVQzB-UqKxDbo6R_9Rn_a96bvedkwME0';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 開始執行 Migration 009: 將 video_duration 從分鐘改為秒數...\n');

  try {
    // 讀取 migration SQL 檔案
    const sqlPath = path.join(__dirname, '../db/migrations/009_convert_video_duration_to_seconds.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log();

    // 執行 migration
    console.log('⏳ 正在執行 migration...\n');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });

    if (error) {
      // 嘗試直接更新（如果沒有 exec_sql 函數）
      console.log('⚠️  使用備用方案：直接更新資料...\n');

      // 先查詢目前有多少筆資料
      const { data: lessons, error: fetchError } = await supabase
        .from('course_lessons')
        .select('id, title, video_duration')
        .not('video_duration', 'is', null);

      if (fetchError) {
        throw fetchError;
      }

      console.log(`📊 找到 ${lessons.length} 筆需要轉換的課程單元\n`);

      if (lessons.length === 0) {
        console.log('✅ 沒有需要轉換的資料');
        return;
      }

      // 顯示前3筆轉換前的資料
      console.log('📋 轉換前範例資料（前3筆）:');
      lessons.slice(0, 3).forEach((lesson, index) => {
        console.log(`  ${index + 1}. ${lesson.title}: ${lesson.video_duration} 分鐘`);
      });
      console.log();

      // 批次更新
      console.log('⏳ 正在批次更新資料（分鐘 → 秒數）...\n');

      for (const lesson of lessons) {
        const newDuration = lesson.video_duration * 60;
        const { error: updateError } = await supabase
          .from('course_lessons')
          .update({ video_duration: newDuration })
          .eq('id', lesson.id);

        if (updateError) {
          console.error(`❌ 更新失敗 (${lesson.title}):`, updateError.message);
        }
      }

      // 顯示轉換後的資料
      const { data: updatedLessons } = await supabase
        .from('course_lessons')
        .select('id, title, video_duration')
        .not('video_duration', 'is', null)
        .limit(3);

      console.log('📋 轉換後範例資料（前3筆）:');
      updatedLessons.forEach((lesson, index) => {
        const minutes = Math.floor(lesson.video_duration / 60);
        const seconds = lesson.video_duration % 60;
        console.log(`  ${index + 1}. ${lesson.title}: ${lesson.video_duration} 秒 (${minutes} 分 ${seconds} 秒)`);
      });
      console.log();

      console.log(`✅ Migration 完成！已轉換 ${lessons.length} 筆資料`);
    } else {
      console.log('✅ Migration 執行成功！');
      if (data) {
        console.log('📊 結果:', data);
      }
    }

  } catch (err) {
    console.error('❌ Migration 執行失敗:', err);
    process.exit(1);
  }
}

runMigration();
