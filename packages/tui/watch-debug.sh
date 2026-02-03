#!/bin/bash
# Helper script to watch TUI debug logs in real-time

LOG_FILE="$HOME/.katasumi/tui-debug.log"

echo "Watching TUI debug log: $LOG_FILE"
echo "Run 'pnpm run start:tui' in another terminal to see debug output here"
echo "Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

# Create log file if it doesn't exist
mkdir -p "$HOME/.katasumi"
touch "$LOG_FILE"

# Watch the log file
tail -f "$LOG_FILE"
