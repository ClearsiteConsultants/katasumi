import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const LOG_DIR = path.join(os.homedir(), '.katasumi');
const LOG_FILE = path.join(LOG_DIR, 'tui-debug.log');
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Only set up logging in development mode
if (IS_DEVELOPMENT) {
  // Ensure log directory exists
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  // Clear log file on startup
  fs.writeFileSync(LOG_FILE, `=== TUI Debug Log Started: ${new Date().toISOString()} ===\n`);
  fs.writeFileSync(LOG_FILE, `Env ${JSON.stringify(process.env.NODE_ENV, null, 2)}\n`);
  
  // Log the file path on import so users know where to look
  console.error(`Debug log: ${LOG_FILE}`);
}

export function debugLog(...args: any[]): void {
  // Only log in development mode
  if (!IS_DEVELOPMENT) return;
  
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

export function getLogFilePath(): string {
  return LOG_FILE;
}
