#!/bin/bash

echo "🚀 Starting migration to NX..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "📦 Removing existing node_modules..."
    rm -rf node_modules
fi

# Check if dist exists
if [ -d "dist" ]; then
    echo "🗑️  Removing existing dist folder..."
    rm -rf dist
fi

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create NX cache directory
echo "📁 Creating NX cache directory..."
mkdir -p .nx/cache

# Build all projects
echo "🔨 Building all projects..."
npx nx run-many --target=build --all --configuration=production

# Build migrations
echo "🔨 Building migrations..."
npx nx run api:build:migrations

echo "✅ Migration to NX completed!"
echo ""
echo "Next steps:"
echo "1. Update your .env files if needed"
echo "2. Run database migrations: npm run typeorm:migrate"
echo "3. Start development: npm run api:serve & npm run web:serve"
echo "4. Or use Docker: docker-compose -f docker-compose.yml up"
echo ""
echo "🎉 Happy coding with NX!"
