#!/bin/sh

# Exit on any error
set -e

echo "Starting application startup sequence..."

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
    echo "Waiting for database to be ready..."
    sleep 2
done
echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
npx typeorm migration:run -d dist/apps/api/src/database/data-source.migration.js

# Check if migrations ran successfully
if [ $? -eq 0 ]; then
    echo "Migrations completed successfully"
else
    echo "Migration failed, continuing anyway..."
fi

# Start the NestJS application
echo "Starting NestJS application..."
exec node dist/apps/api/main.js
