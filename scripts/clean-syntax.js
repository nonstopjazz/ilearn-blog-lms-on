const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all API route files
const files = glob.sync('src/app/api/**/*.{js,ts}', { cwd: process.cwd() });

let fixed = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remove patterns like:
  // const supabase = createSupabaseAdminClient();
  //     { status: 500 }
  //   );
  // }

  content = content.replace(
    /const supabase = createSupabaseAdminClient\(\);[\s\n]*{\s*status:\s*500\s*}[\s\n]*\);[\s\n]*}/g,
    'const supabase = createSupabaseAdminClient();'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
});

console.log(`\n📊 Fixed ${fixed} files`);
