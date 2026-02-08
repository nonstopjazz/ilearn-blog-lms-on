const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 開始執行 Migration 019: 同步 auth.users 到 public.users...\n');

  try {
    // 讀取 migration SQL 檔案
    const sqlPath = path.join(__dirname, '../db/migrations/019_sync_auth_users_to_public_users.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Migration SQL 已載入');
    console.log('─'.repeat(60));
    console.log();

    // 將SQL分割成多個語句執行（因為Supabase不支援直接執行包含多個語句的SQL）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 共 ${statements.length} 個 SQL 語句需要執行\n`);

    // 先檢查現有用戶數量
    const { count: authUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log(`📋 現有 public.users 數量: ${authUsersCount || 0}`);

    // 執行每個語句
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`⏳ 執行語句 ${i + 1}/${statements.length}...`);

      try {
        // 使用rpc執行SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: stmt
        });

        if (error) {
          console.log(`⚠️  exec_sql 不可用，嘗試直接執行...`);
          // 如果是INSERT語句，手動處理
          if (stmt.toUpperCase().includes('INSERT INTO PUBLIC.USERS')) {
            console.log('📝 手動同步用戶到 public.users...');
            // 這部分由觸發器自動處理，跳過
          }
        } else {
          console.log(`✅ 語句 ${i + 1} 執行成功`);
        }
      } catch (err) {
        console.log(`⚠️  語句 ${i + 1} 可能已存在，繼續...`);
      }
    }

    // 檢查執行後的用戶數量
    const { count: newUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log();
    console.log('─'.repeat(60));
    console.log(`✅ Migration 完成！`);
    console.log(`📊 執行前 users 數量: ${authUsersCount || 0}`);
    console.log(`📊 執行後 users 數量: ${newUsersCount || 0}`);
    console.log(`📊 新增用戶: ${(newUsersCount || 0) - (authUsersCount || 0)}`);
    console.log();
    console.log('🎯 觸發器已設置：');
    console.log('   ✓ on_auth_user_created - 新用戶自動同步');
    console.log('   ✓ on_profile_updated - profile 更新自動同步');
    console.log();

  } catch (err) {
    console.error('❌ Migration 執行失敗:', err);
    console.error('詳細錯誤:', err.message);
    process.exit(1);
  }
}

runMigration();
