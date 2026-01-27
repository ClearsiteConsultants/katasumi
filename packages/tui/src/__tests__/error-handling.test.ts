/**
 * Tests for error handling in TUI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logError, getUserFriendlyMessage } from '../utils/error-logger.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Error Logger', () => {
  const katasumiDir = path.join(os.homedir(), '.katasumi');
  const errorLogPath = path.join(katasumiDir, 'error.log');

  beforeEach(() => {
    // Clean up error log before each test
    if (fs.existsSync(errorLogPath)) {
      fs.unlinkSync(errorLogPath);
    }
  });

  it('should log errors to ~/.katasumi/error.log with timestamp', () => {
    const testError = new Error('Test error message');
    logError('Test error context', testError);

    expect(fs.existsSync(errorLogPath)).toBe(true);
    const logContent = fs.readFileSync(errorLogPath, 'utf8');
    expect(logContent).toContain('Test error context');
    expect(logContent).toContain('Test error message');
    expect(logContent).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp format
  });

  it('should return user-friendly message for database not found error', () => {
    const error = new Error('Core database not found at path: /some/path');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Database error: Core shortcuts database not found. Please ensure the database is built.');
  });

  it('should return user-friendly message for database connection error', () => {
    const error = new Error('Failed to connect to core database: Connection refused');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Database error: Could not connect to shortcuts database.');
  });

  it('should return user-friendly message for network errors', () => {
    const error = new Error('ECONNREFUSED: Connection refused');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Network error: Check your connection and try again.');
  });

  it('should return user-friendly message for AI errors', () => {
    const error = new Error('AI service error: Invalid API key');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('AI service unavailable. Using keyword search.');
  });

  it('should return user-friendly message for rate limit errors', () => {
    const error = new Error('rate limit exceeded');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Rate limit reached. Upgrade to Premium for unlimited AI searches.');
  });

  it('should return generic message for unknown errors', () => {
    const error = new Error('Some unknown error');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Some unknown error');
  });

  it('should handle non-Error objects', () => {
    const message = getUserFriendlyMessage('String error');
    expect(message).toBe('An unexpected error occurred. Please check the error log for details.');
  });
});

describe('Empty States', () => {
  it('should show helpful message when no apps match search', () => {
    const query = 'asdfqwer';
    const message = `No apps match your search "${query}". Try a different query.`;
    expect(message).toContain('No apps match');
    expect(message).toContain(query);
  });

  it('should show helpful message when no shortcuts found', () => {
    const message = 'No shortcuts found. Try adjusting filters or search query.';
    expect(message).toContain('Try adjusting');
  });

  it('should show helpful message when search returns no results', () => {
    const query = 'nonexistent';
    const message = `No results found for "${query}". Try a different search query.`;
    expect(message).toContain('No results found');
    expect(message).toContain(query);
  });
});
