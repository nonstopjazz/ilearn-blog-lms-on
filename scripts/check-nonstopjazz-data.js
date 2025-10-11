const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytzspnjmkvrkbztnaomm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0enNwbmpta3Zya2J6dG5hb21tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIwMTc4MiwiZXhwIjoyMDY3Nzc3NzgyfQ.RKVWkzKLfpzKVQzB-UqKxDbo6R_9Rn_a96bvedkwME0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStudentData() {
  console.log('🔍 檢查 nonstopjazz@gmail.com 的資料...\n');

  // 先找到這個學生的 user_id
  const { data: student, error: studentError } = await supabase
    .from('course_requests')
    .select('user_id, user_info')
    .eq('status', 'approved')
    .ilike('user_info->>email', 'nonstopjazz@gmail.com');

  if (studentError) {
    console.error('查詢學生錯誤:', studentError);
    return;
  }

  if (!student || student.length === 0) {
    console.log('❌ 找不到該學生');
    return;
  }

  const studentData = student[0];
  console.log('✅ 學生 ID:', studentData.user_id);
  console.log('學生資訊:', JSON.stringify(studentData.user_info, null, 2));

  // 檢查各種學習資料
  console.log('\n📚 檢查學習資料...\n');

  const { data: vocab } = await supabase
    .from('vocabulary_sessions')
    .select('*')
    .eq('student_id', studentData.user_id);

  console.log('單字學習記錄數量:', vocab?.length || 0);
  if (vocab && vocab.length > 0) {
    console.log('最新一筆:', JSON.stringify(vocab[0], null, 2));
  }

  const { data: exams } = await supabase
    .from('exam_records')
    .select('*')
    .eq('student_id', studentData.user_id);

  console.log('\n考試記錄數量:', exams?.length || 0);
  if (exams && exams.length > 0) {
    console.log('最新一筆:', JSON.stringify(exams[0], null, 2));
  }

  const { data: assignments } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('student_id', studentData.user_id);

  console.log('\n作業記錄數量:', assignments?.length || 0);
  if (assignments && assignments.length > 0) {
    console.log('最新一筆:', JSON.stringify(assignments[0], null, 2));
  }

  // 檢查 API 回傳
  console.log('\n🔍 測試 API 回傳...\n');
  const apiUrl = `http://localhost:3000/api/admin/students/${studentData.user_id}/learning-data?range=all`;
  console.log('測試 URL:', apiUrl);

  try {
    const response = await fetch(apiUrl);
    const result = await response.json();
    console.log('\nAPI 回應:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('API 測試失敗:', error.message);
  }
}

checkStudentData();
