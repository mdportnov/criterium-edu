#!/bin/sh

# Exit on any error
set -e

echo "Starting application startup sequence..."

# Run database migrations
echo "Running database migrations..."
npx typeorm migration:run -d dist/apps/api/src/database/data-source.migration.js

# Check if migrations ran successfully
if [ $? -eq 0 ]; then
    echo "Migrations completed successfully"
else
    echo "Migration failed, exiting..."
    exit 1
fi

# Start the NestJS application
echo "Starting NestJS application..."
exec node dist/apps/api/main.js
