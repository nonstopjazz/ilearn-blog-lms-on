const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/admin/students/route.ts',
  'src/app/api/admin/check-constraints/route.ts',
  'src/app/api/admin/add-course/route.ts',
  'src/app/api/admin/sync-courses/route.ts',
  'src/app/api/admin/migrate/route.ts',
  'src/app/api/courses/route.js',
  'src/app/api/courses/[courseId]/lessons/route.js',
  'src/app/api/quiz/update/[id]/route.js',
  'src/app/api/quiz/take/[quizId]/route.js',
  'src/app/api/debug/quiz-attempts/route.js',
  'src/app/api/debug/user/route.js',
  'src/app/api/quiz/results/route.js',
  'src/app/api/quiz/[id]/route.js',
  'src/app/api/courses/[courseId]/route.js',
  'src/app/api/quiz/attempt/route.js',
  'src/app/api/quiz/submit/route.js',
  'src/app/api/user/reminder-preferences/route.js',
  'src/app/api/learning-reminders/route.js',
  'src/app/api/course-requests/route.ts',
  'src/app/api/orders/route.ts',
  'src/app/api/quiz/create/route.js',
  'src/app/api/quiz/upload/route.js',
  'src/app/api/admin/test-email/route.js',
  'src/app/api/admin/send-reminders/route.js',
  'src/app/api/admin/course-reminders/route.js'
];

let totalFixed = 0;
let totalErrors = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      totalErrors++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace import statement
    content = content.replace(
      /import\s*{\s*getSupabaseClient\s*}\s*from\s*['"]@\/lib\/supabase-server['"]/g,
      "import { createSupabaseAdminClient } from '@/lib/supabase-server'"
    );

    // Replace function calls and null checks
    content = content.replace(
      /const\s+supabase\s*=\s*getSupabaseClient\(\)\s*;\s*if\s*\(\s*!supabase\s*\)\s*{[^}]*}/gs,
      'const supabase = createSupabaseAdminClient();'
    );

    // Replace simple function calls
    content = content.replace(
      /getSupabaseClient\(\)/g,
      'createSupabaseAdminClient()'
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
      totalFixed++;
    } else {
      console.log(`ℹ️  No changes: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
    totalErrors++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${totalFixed} files`);
console.log(`   Errors: ${totalErrors} files`);
console.log(`   Total: ${files.length} files`);

if (totalFixed > 0) {
  console.log(`\n✨ Run: git add -A && git commit -m "批量修正所有 API 使用新的 Supabase 客戶端" && git push`);
}
