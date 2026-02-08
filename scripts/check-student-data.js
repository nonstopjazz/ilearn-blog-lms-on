const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 請設定環境變數 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStudentData() {
  console.log('🔍 查詢學生資料...\n');

  // 查詢批准的課程申請
  const { data: requests, error } = await supabase
    .from('course_requests')
    .select('*')
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false });

  if (error) {
    console.error('❌ 查詢失敗:', error);
    return;
  }

  console.log(`✅ 找到 ${requests.length} 筆批准的課程申請\n`);

  // 提取唯一學生
  const uniqueStudents = new Map();
  requests.forEach(request => {
    if (!uniqueStudents.has(request.user_id)) {
      uniqueStudents.set(request.user_id, {
        id: request.user_id,
        name: request.user_info?.name || '未知',
        email: request.user_info?.email || '無',
        phone: request.user_info?.phone || '無',
        user_info: request.user_info
      });
    }
  });

  console.log(`📊 共有 ${uniqueStudents.size} 位學生\n`);
  console.log('=' .repeat(80));

  Array.from(uniqueStudents.values()).forEach((student, index) => {
    console.log(`\n${index + 1}. 學生資料:`);
    console.log(`   ID: ${student.id}`);
    console.log(`   姓名: ${student.name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   電話: ${student.phone}`);
    console.log(`\n   完整 user_info:`);
    console.log(JSON.stringify(student.user_info, null, 4));
    console.log('-'.repeat(80));
  });

  console.log('\n\n🔍 檢查 course_requests 表的欄位結構...\n');
  if (requests.length > 0) {
    console.log('📋 第一筆資料的所有欄位:');
    console.log(JSON.stringify(requests[0], null, 2));
  }
}

checkStudentData();
