const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Starting migration 008: Create public.users table...\n')

  // Read migration file
  const migrationPath = path.join(__dirname, '../db/migrations/008_create_public_users_table.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('📄 Migration SQL:')
  console.log('─'.repeat(60))
  console.log(migrationSQL)
  console.log('─'.repeat(60))
  console.log()

  try {
    // Execute migration using rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    })

    if (error) {
      // If exec_sql doesn't exist, try direct query
      if (error.message.includes('exec_sql')) {
        console.log('⚠️  exec_sql function not found, trying direct query...\n')

        // Split by semicolons and execute each statement
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0)

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i] + ';'
          console.log(`Executing statement ${i + 1}/${statements.length}...`)

          const { error: stmtError } = await supabase.rpc('exec', {
            sql: statement
          })

          if (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError.message)
            throw stmtError
          }
        }

        console.log('\n✅ All statements executed successfully!')
      } else {
        throw error
      }
    } else {
      console.log('✅ Migration executed successfully!')
      if (data) {
        console.log('Response:', data)
      }
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...')

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    if (usersError) {
      console.error('❌ Error verifying users table:', usersError.message)
    } else {
      console.log('✅ Users table created successfully!')
      console.log('   Found', users.length, 'user(s)')
      if (users.length > 0) {
        console.log('   Admin user:', users[0].email)
      }
    }

    console.log('\n🎉 Migration 008 completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Try creating a blog post again')
    console.log('2. The author_id should now work correctly')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\nPlease run this SQL manually in Supabase SQL Editor:')
    console.error('https://supabase.com/dashboard/project/_/sql')
    process.exit(1)
  }
}

runMigration()
