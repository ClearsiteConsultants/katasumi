import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const LOG_DIR = path.join(os.homedir(), '.katasumi');
const LOG_FILE = path.join(LOG_DIR, 'tui-debug.log');
const DEBUG_ENABLED = process.env.KATASUMI_DEBUG !== '0';

// Set up logging once on import.
if (DEBUG_ENABLED) {
  // Ensure log directory exists
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  // Append a startup marker so multiple runs can be traced in one file.
  fs.appendFileSync(LOG_FILE, `\n=== TUI Debug Log Started: ${new Date().toISOString()} ===\n`);
  fs.appendFileSync(LOG_FILE, `Env ${JSON.stringify(process.env.NODE_ENV ?? 'undefined')}\n`);
  
  // Log the file path on import so users know where to look
  console.error(`Debug log: ${LOG_FILE}`);
}

export function debugLog(...args: any[]): void {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

export function getLogFilePath(): string {
  return LOG_FILE;
}
