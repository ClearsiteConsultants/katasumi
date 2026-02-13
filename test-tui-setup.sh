#!/bin/bash
# Test script to verify TUI setup works correctly

set -e

echo "🧪 Testing TUI Setup"
echo "===================="
echo ""

# Clean up any old databases
echo "🗑️  Cleaning up old databases..."
rm -f packages/core/data/shortcuts.db
rm -f packages/core/data/shortcuts.db-journal
rm -f packages/core/data/katasumi.db
rm -f packages/core/data/katasumi.db-journal
rm -f katasumi.db
rm -f katasumi.db-journal

echo "✅ Cleanup complete"
echo ""

# Run setup:tui
echo "🔨 Running setup:tui..."
pnpm run setup:tui

echo ""

# Verify database was created
if [ -f "packages/core/data/shortcuts.db" ]; then
    echo "✅ Database created successfully at packages/core/data/shortcuts.db"
    
    # Check database size
    SIZE=$(du -h packages/core/data/shortcuts.db | cut -f1)
    echo "📊 Database size: $SIZE"
    
    # Verify database has tables
    echo ""
    echo "🔍 Verifying database schema..."
    sqlite3 packages/core/data/shortcuts.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" | head -10
    
    echo ""
    echo "🔍 Checking record counts..."
    SHORTCUT_COUNT=$(sqlite3 packages/core/data/shortcuts.db "SELECT COUNT(*) FROM shortcuts;")
    APP_COUNT=$(sqlite3 packages/core/data/shortcuts.db "SELECT COUNT(*) FROM app_info;")
    
    echo "  Shortcuts: $SHORTCUT_COUNT"
    echo "  Apps: $APP_COUNT"
    
    echo ""
    echo "✅ All tests passed!"
else
    echo "❌ Database not found at packages/core/data/shortcuts.db"
    exit 1
fi
