// 刪除假課程資料的腳本
const { createClient } = require('@supabase/supabase-js');

// 直接使用環境變數
const supabaseUrl = 'https://ytzspnjmkvrkbztnaomm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0enNwbmpta3Zya2J6dG5hb21tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIwMTc4MiwiZXhwIjoyMDY3Nzc3NzgyfQ.RKVWkzKLfpzKVQzB-UqKxDbo6R_9Rn_a96bvedkwME0';

const supabase = createClient(supabaseUrl, supabaseKey);

const FAKE_COURSE_IDS = ['course_002', 'course_001', 'course_011', 'course_013'];

async function deleteFakeCourses() {
  console.log('=== 開始刪除假課程資料 ===');
  console.log('要刪除的課程 ID:', FAKE_COURSE_IDS);

  try {
    // 1. 從 course_requests 表刪除
    console.log('\n🗑️  正在從 course_requests 表刪除...');
    const { data: deletedRequests, error: requestError } = await supabase
      .from('course_requests')
      .delete()
      .in('course_id', FAKE_COURSE_IDS)
      .select();

    if (requestError) {
      console.error('❌ 刪除 course_requests 失敗:', requestError);
    } else {
      console.log(`✅ 成功從 course_requests 刪除 ${deletedRequests?.length || 0} 條記錄`);
      if (deletedRequests && deletedRequests.length > 0) {
        deletedRequests.forEach(record => {
          console.log(`   - ${record.course_id} (${record.course_title})`);
        });
      }
    }

    // 2. 從 user_course_access 表刪除
    console.log('\n🗑️  正在從 user_course_access 表刪除...');
    const { data: deletedAccess, error: accessError } = await supabase
      .from('user_course_access')
      .delete()
      .in('course_id', FAKE_COURSE_IDS)
      .select();

    if (accessError) {
      console.error('❌ 刪除 user_course_access 失敗:', accessError);
    } else {
      console.log(`✅ 成功從 user_course_access 刪除 ${deletedAccess?.length || 0} 條記錄`);
      if (deletedAccess && deletedAccess.length > 0) {
        deletedAccess.forEach(record => {
          console.log(`   - ${record.course_id} (用戶: ${record.user_id})`);
        });
      }
    }

    console.log('\n=== 刪除完成 ===');
    console.log('請重新整理 /my-courses 頁面查看結果');

  } catch (error) {
    console.error('💥 發生錯誤:', error);
  }
}

deleteFakeCourses();
