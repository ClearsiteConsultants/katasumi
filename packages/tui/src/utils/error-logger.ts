/**
 * Error logging utility for Katasumi TUI
 * Logs errors to ~/.katasumi/error.log with timestamps
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let logPath: string | null = null;

function getLogPath(): string {
  if (!logPath) {
    const homeDir = os.homedir();
    const katasumiDir = path.join(homeDir, '.katasumi');
    
    // Create directory if it doesn't exist
    try {
      if (!fs.existsSync(katasumiDir)) {
        fs.mkdirSync(katasumiDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create .katasumi directory:', error);
      // Fall back to temp directory
      logPath = path.join(os.tmpdir(), 'katasumi-error.log');
      return logPath;
    }
    
    logPath = path.join(katasumiDir, 'error.log');
  }
  
  return logPath;
}

export function logError(message: string, error?: Error | unknown): void {
  const timestamp = new Date().toISOString();
  const errorDetails = error instanceof Error 
    ? `${error.message}\n${error.stack}` 
    : String(error);
  
  const logEntry = `[${timestamp}] ${message}\n${errorDetails}\n\n`;
  
  try {
    const logFile = getLogPath();
    fs.appendFileSync(logFile, logEntry, 'utf8');
  } catch (logError) {
    // If we can't write to the log file, at least output to console
    console.error('Failed to write to error log:', logError);
    console.error('Original error:', message, error);
  }
}

/**
 * Get user-friendly error message for display
 * Hides implementation details and stack traces from users
 */
export function getUserFriendlyMessage(error: Error | unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Database errors
    if (message.includes('Core database not found')) {
      return `Database error: Core shortcuts database not found. Please ensure the database is built.`;
    }
    if (message.includes('Failed to connect to core database')) {
      return `Database error: Could not connect to shortcuts database.`;
    }
    if (message.includes('Failed to connect to user database')) {
      return `Database error: Could not connect to user data storage.`;
    }
    if (message.includes('Core database URL is required')) {
      return `Configuration error: Database URL is required.`;
    }
    
    // Network errors
    if (message.includes('ENOTFOUND') || message.includes('ECONNREFUSED') || message.includes('Network')) {
      return `Network error: Check your connection and try again.`;
    }
    
    // AI errors
    if (message.includes('AI') || message.includes('API key')) {
      return `AI service unavailable. Using keyword search.`;
    }
    
    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return `Rate limit reached. Upgrade to Premium for unlimited AI searches.`;
    }
    
    // Generic database error
    if (message.includes('database') || message.includes('SQL')) {
      return `Database error: ${message.split(':')[0]}`;
    }
    
    // Default: show first line of error message only
    return message.split('\n')[0];
  }
  
  return 'An unexpected error occurred. Please check the error log for details.';
}
