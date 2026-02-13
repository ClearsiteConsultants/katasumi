#!/bin/bash
# Quick script to setup web package database (User tables)

set -e

echo "🗄️  Setting up PostgreSQL Database (Web + Core tables)"
echo "======================================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Using default DATABASE_URL: postgres://katasumi:dev_password@localhost:5432/katasumi_dev"
    export DATABASE_URL="postgres://katasumi:dev_password@localhost:5432/katasumi_dev"
fi

echo "📝 Running core migrations..."
cd packages/core
DB_TYPE="postgres" pnpm run migrate

echo ""
echo "📝 Seeding shortcuts data..."
DB_TYPE="postgres" pnpm run seed

echo ""
echo "✅ PostgreSQL database setup complete!"
echo ""
echo "You can now:"
echo "  - Sign up at http://localhost:3000/login"
echo "  - View database: run a PostgreSQL client or admin tool"
echo ""
