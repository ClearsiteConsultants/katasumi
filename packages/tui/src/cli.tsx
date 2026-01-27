#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import readline from 'readline';
import App from './App.js';

// Enable keypress events
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  readline.emitKeypressEvents(process.stdin);
}

const startTime = Date.now();

render(<App />);

// Log startup time for verification
const elapsedTime = Date.now() - startTime;
if (elapsedTime > 200) {
  console.error(`Warning: Startup took ${elapsedTime}ms (target: <200ms)`);
}
