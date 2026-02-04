#!/bin/bash
# Quick script to setup web package database (User tables)

set -e

echo "🗄️  Setting up Web Database (User, Collections, etc.)"
echo "======================================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Using default DATABASE_URL: postgres://katasumi:dev_password@localhost:5432/katasumi_dev"
    export DATABASE_URL="postgres://katasumi:dev_password@localhost:5432/katasumi_dev"
fi

echo "📝 Generating Prisma Client..."
cd packages/web
pnpm prisma generate

echo ""
echo "📝 Running database migrations..."
pnpm prisma migrate dev --name init

echo ""
echo "✅ Web database setup complete!"
echo ""
echo "You can now:"
echo "  - Sign up at http://localhost:3000/login"
echo "  - View database: cd packages/web && pnpm prisma studio"
echo ""
