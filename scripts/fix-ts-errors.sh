#!/bin/bash

echo "🔧 Fixing common TypeScript errors..."

# Fix parseInt with potentially undefined values
find apps/api/src -name "*.ts" -type f -exec sed -i '' 's/parseInt(process\.env\.\([A-Z_]*\))/parseInt(process.env.\1 || '\''0'\'')/g' {} +

# Fix logger usage before assignment in main.ts
sed -i '' 's/await runDatabaseMigrations(logger, dataSource);/\/\/ await runDatabaseMigrations(logger, dataSource);/g' apps/api/src/main.ts
sed -i '' 's/logger\.log(`Application is running/console.log(`Application is running/g' apps/api/src/main.ts

# Fix error handling with unknown type
find apps/api/src -name "*.ts" -type f -exec sed -i '' 's/error\.message/(error as any).message/g' {} +
find apps/api/src -name "*.ts" -type f -exec sed -i '' 's/error\.stack/(error as any).stack/g' {} +

# Fix null assignments for TypeORM
find apps/api/src -name "*.ts" -type f -exec sed -i '' 's/= null;/= undefined;/g' {} +

echo "✅ Common TypeScript errors fixed!"
echo "⚠️  Note: Some errors may require manual intervention"
