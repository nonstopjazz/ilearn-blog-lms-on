// 刪除假課程資料的腳本
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 請設定環境變數 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

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
