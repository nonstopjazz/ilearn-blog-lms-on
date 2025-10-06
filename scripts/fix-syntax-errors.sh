#!/bin/bash

# Fix all syntax errors caused by the batch replacement
find src/app/api -type f \( -name "*.js" -o -name "*.ts" \) -exec sed -i 's/createSupabaseAdminClient();,/createSupabaseAdminClient();/g' {} \;
find src/app/api -type f \( -name "*.js" -o -name "*.ts" \) -exec sed -i '/^[[:space:]]*{ status: 500 });$/d' {} \;
find src/app/api -type f \( -name "*.js" -o -name "*.ts" \) -exec sed -i '/^[[:space:]]*);$/d' {} \;
find src/app/api -type f \( -name "*.js" -o -name "*.ts" \) -exec sed -i '/^[[:space:]]*}$/N;s/}\n[[:space:]]*const supabase/}\n\n    const supabase/g' {} \;

echo "✅ All syntax errors fixed!"
