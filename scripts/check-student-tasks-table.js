/**
 * 檢查 student_tasks 表是否存在以及權限設定
 *
 * 運行方式: node scripts/check-student-tasks-table.js
 * 或者帶環境變數: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/check-student-tasks-table.js
 */

// 嘗試加載 dotenv，如果沒有安裝則使用環境變數
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  console.log('⚠️  dotenv 未安裝，使用系統環境變數\n');
}
const { createClient } = require('@supabase/supabase-js');

async function checkStudentTasksTable() {
  console.log('🔍 開始檢查 student_tasks 表...\n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('❌ 缺少環境變數:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', url ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  console.log('✓ Supabase 客戶端已建立\n');

  // 1. 檢查表是否存在
  console.log('📊 檢查 1: 表是否存在');
  try {
    const { data, error } = await supabase
      .from('student_tasks')
      .select('*')
      .limit(0);

    if (error) {
      if (error.code === '42P01') {
        console.error('❌ student_tasks 表不存在！');
        console.error('   錯誤代碼:', error.code);
        console.error('   錯誤訊息:', error.message);
        console.log('\n💡 解決方案: 需要執行 db/migrations/007_create_student_tasks.sql');
      } else {
        console.error('❌ 查詢錯誤:', error);
      }
      return;
    }
    console.log('✓ student_tasks 表存在\n');
  } catch (err) {
    console.error('❌ 檢查表時發生錯誤:', err.message);
    return;
  }

  // 2. 檢查表結構
  console.log('📊 檢查 2: 表結構');
  try {
    const { data, error } = await supabase
      .from('student_tasks')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 無法讀取表結構:', error.message);
      return;
    }

    console.log('✓ 表結構正常');
    if (data && data.length > 0) {
      console.log('   欄位:', Object.keys(data[0]).join(', '));
    }
    console.log('');
  } catch (err) {
    console.error('❌ 檢查表結構時發生錯誤:', err.message);
  }

  // 3. 測試插入權限
  console.log('📊 檢查 3: 插入權限');
  const testData = {
    student_id: '00000000-0000-0000-0000-000000000000', // 假的 UUID
    task_description: 'TEST - 請忽略此記錄',
    task_type: 'onetime',
    due_date: '2099-12-31',
    priority: 'low'
  };

  try {
    const { data, error } = await supabase
      .from('student_tasks')
      .insert([testData])
      .select()
      .single();

    if (error) {
      if (error.code === '23503') {
        console.log('⚠️  外鍵約束錯誤（這是正常的，因為我們使用了假的 student_id）');
        console.log('   但這證明了插入權限是正常的！');
        console.log('✓ 插入權限正常\n');
      } else {
        console.error('❌ 插入錯誤:', error);
        console.error('   錯誤代碼:', error.code);
        console.error('   錯誤訊息:', error.message);
        console.error('   詳細信息:', error.details);
        console.error('   提示:', error.hint);
        return;
      }
    } else {
      // 成功插入，刪除測試記錄
      console.log('✓ 成功插入測試記錄');
      await supabase
        .from('student_tasks')
        .delete()
        .eq('id', data.id);
      console.log('✓ 已清理測試記錄\n');
    }
  } catch (err) {
    console.error('❌ 測試插入時發生錯誤:', err.message);
  }

  // 4. 檢查已批准的學生列表
  console.log('📊 檢查 4: 已批准的學生');
  try {
    const { data: students, error } = await supabase
      .from('course_requests')
      .select('user_id, user_info')
      .eq('status', 'approved')
      .limit(5);

    if (error) {
      console.error('❌ 無法獲取學生列表:', error.message);
      return;
    }

    if (!students || students.length === 0) {
      console.log('⚠️  沒有已批准的學生');
    } else {
      console.log(`✓ 找到 ${students.length} 個學生（顯示前 5 個）:`);
      students.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.user_info?.name || '未知'} (${s.user_id})`);
      });
    }
    console.log('');
  } catch (err) {
    console.error('❌ 檢查學生列表時發生錯誤:', err.message);
  }

  // 5. 測試使用真實學生 ID 插入
  console.log('📊 檢查 5: 使用真實學生 ID 測試插入');
  try {
    const { data: students } = await supabase
      .from('course_requests')
      .select('user_id')
      .eq('status', 'approved')
      .limit(1)
      .single();

    if (!students) {
      console.log('⚠️  跳過（沒有已批准的學生）\n');
    } else {
      const realTestData = {
        student_id: students.user_id,
        task_description: 'TEST - 自動測試記錄，可以刪除',
        task_type: 'onetime',
        due_date: '2099-12-31',
        priority: 'low',
        category: 'test'
      };

      const { data, error } = await supabase
        .from('student_tasks')
        .insert([realTestData])
        .select()
        .single();

      if (error) {
        console.error('❌ 使用真實學生 ID 插入失敗:', error);
        console.error('   錯誤代碼:', error.code);
        console.error('   錯誤訊息:', error.message);
        console.error('   詳細信息:', error.details);
      } else {
        console.log('✓ 成功插入真實測試記錄');
        console.log('   記錄 ID:', data.id);

        // 刪除測試記錄
        const { error: deleteError } = await supabase
          .from('student_tasks')
          .delete()
          .eq('id', data.id);

        if (deleteError) {
          console.error('⚠️  無法刪除測試記錄:', deleteError.message);
          console.log('   請手動刪除 ID:', data.id);
        } else {
          console.log('✓ 已清理測試記錄');
        }
      }
    }
  } catch (err) {
    console.error('❌ 真實測試時發生錯誤:', err.message);
  }

  console.log('\n✅ 診斷完成！');
}

checkStudentTasksTable().catch(console.error);
