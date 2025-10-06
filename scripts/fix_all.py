import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern 1: Remove lines after createSupabaseAdminClient();
    # const supabase = createSupabaseAdminClient();
    #     { status: 500 }
    #   );
    # }
    pattern1 = r'(const supabase = createSupabaseAdminClient\(\);)\s*\{\s*status:\s*500\s*\}\s*\);\s*\}'
    content = re.sub(pattern1, r'\1', content, flags=re.MULTILINE)

    # Pattern 2: Remove comma and status from same line
    # const supabase = createSupabaseAdminClient();, { status: 500 });
    pattern2 = r'(const supabase = createSupabaseAdminClient\(\);),\s*\{\s*status:\s*500\s*\}\s*\);'
    content = re.sub(pattern2, r'\1', content)

    # Pattern 3: Remove standalone } after createSupabaseAdminClient();
    # const supabase = createSupabaseAdminClient();
    #     }
    pattern3 = r'(const supabase = createSupabaseAdminClient\(\);)\s*\}'
    content = re.sub(pattern3, r'\1', content, flags=re.MULTILINE)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Find all JS and TS files in src/app/api
fixed = 0
for root, dirs, files in os.walk('src/app/api'):
    for file in files:
        if file.endswith(('.js', '.ts')):
            filepath = os.path.join(root, file)
            if fix_file(filepath):
                print(f'Fixed: {filepath}')
                fixed += 1

print(f'\nFixed {fixed} files')
