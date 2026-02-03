#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import readline from 'readline';
import App from './App.js';
import { debugLog } from './utils/debug-logger.js';

// Clear screen before starting TUI to ensure Header appears at top
process.stdout.write('\x1b[2J\x1b[H'); // ANSI escape codes: clear screen + move cursor to home

// Enable keypress events
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  readline.emitKeypressEvents(process.stdin);
}

const startTime = Date.now();

debugLog('🚀 TUI Starting...');
debugLog(`  Screen cleared to ensure Header at top`);

render(<App />);

// Log startup time for verification (to debug log, not stderr)
const elapsedTime = Date.now() - startTime;
debugLog(`✅ TUI rendered in ${elapsedTime}ms`);
