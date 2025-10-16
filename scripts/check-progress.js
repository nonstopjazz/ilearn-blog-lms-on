// 檢查用戶學習進度的腳本
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytzspnjmkvrkbztnaomm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0enNwbmpta3Zya2J6dG5hb21tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIwMTc4MiwiZXhwIjoyMDY3Nzc3NzgyfQ.RKVWkzKLfpzKVQzB-UqKxDbo6R_9Rn_a96bvedkwME0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProgress() {
  console.log('=== 檢查學習進度記錄 ===\n');

  try {
    // 1. 檢查 user_lesson_progress 表結構
    console.log('📋 檢查 user_lesson_progress 表結構...');
    const { data: sampleRecord, error: structError } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .limit(1);

    if (structError) {
      console.error('❌ 查詢表結構失敗:', structError);
    } else if (sampleRecord && sampleRecord.length > 0) {
      console.log('✅ 表欄位:', Object.keys(sampleRecord[0]));
    } else {
      console.log('⚠️  表中沒有任何記錄');
    }

    // 2. 查詢所有進度記錄
    console.log('\n📊 查詢所有進度記錄...');
    const { data: allProgress, error: allError } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ 查詢失敗:', allError);
      return;
    }

    console.log(`找到 ${allProgress?.length || 0} 條進度記錄`);

    if (allProgress && allProgress.length > 0) {
      console.log('\n最近的 5 條記錄:');
      allProgress.slice(0, 5).forEach((record, index) => {
        console.log(`\n記錄 ${index + 1}:`);
        console.log(`  用戶 ID: ${record.user_id}`);
        console.log(`  課程單元 ID: ${record.lesson_id}`);
        console.log(`  當前時間: ${record.current_time} 秒`);
        console.log(`  進度百分比: ${record.progress_percentage}%`);
        console.log(`  已完成: ${record.completed}`);
        console.log(`  最後觀看: ${record.last_watched_at}`);
        console.log(`  建立時間: ${record.created_at}`);
      });
    }

    // 3. 檢查特定用戶的進度（您的用戶 ID）
    const userId = '0aea72e3-26d5-409e-9992-a59936fd3abd';
    console.log(`\n\n🔍 檢查用戶 ${userId} 的進度...`);

    const { data: userProgress, error: userError } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId);

    if (userError) {
      console.error('❌ 查詢用戶進度失敗:', userError);
    } else {
      console.log(`✅ 找到 ${userProgress?.length || 0} 條該用戶的進度記錄`);

      if (userProgress && userProgress.length > 0) {
        userProgress.forEach((record, index) => {
          console.log(`\n進度 ${index + 1}:`);
          console.log(`  課程單元: ${record.lesson_id}`);
          console.log(`  進度: ${record.progress_percentage}%`);
          console.log(`  當前時間: ${record.current_time} 秒`);
          console.log(`  已完成: ${record.completed}`);
        });
      } else {
        console.log('⚠️  該用戶沒有任何學習進度記錄');
        console.log('💡 這表示用戶從未在 /courses/[courseId]/learn 頁面觀看過任何課程');
      }
    }

  } catch (error) {
    console.error('💥 發生錯誤:', error);
  }
}

checkProgress();
