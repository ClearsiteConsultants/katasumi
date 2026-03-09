import { DatabaseAdapter, SQLiteAdapter } from '@katasumi/core';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { debugLog } from './debug-logger.js';

// ES module dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Singleton database adapter
let dbAdapter: DatabaseAdapter | null = null;

export function getDbAdapter(): DatabaseAdapter {
  if (!dbAdapter) {
    // Resolve path for both monorepo development and published package installs.
    const possiblePaths = [
      path.resolve(__dirname, '..', '..', '..', 'core', 'data', 'shortcuts.db'),
      path.resolve(__dirname, '..', 'core', 'data', 'shortcuts.db'),
      path.resolve(process.cwd(), '..', 'core', 'data', 'shortcuts.db'),
      path.resolve(process.cwd(), 'packages', 'core', 'data', 'shortcuts.db'),
      path.resolve(__dirname, '..', '..', 'node_modules', '@katasumi', 'core', 'data', 'shortcuts.db'),
      path.resolve(process.cwd(), 'node_modules', '@katasumi', 'core', 'data', 'shortcuts.db'),
    ];

    debugLog('DB init: attempting to locate core shortcuts database');
    possiblePaths.forEach((p) => debugLog(`DB candidate path: ${p}`));

    let coreDbPath = possiblePaths.find((p) => {
      const exists = fs.existsSync(p);
      if (exists) {
        console.log(`✓ Found core database at: ${p}`);
        debugLog(`DB found at: ${p}`);
      }
      return exists;
    });

    if (!coreDbPath) {
      console.error('❌ Core database not found. Searched paths:');
      possiblePaths.forEach(p => console.error(`   - ${p}`));
      console.error('Using empty in-memory database.');
      debugLog('DB not found, falling back to in-memory mode');
      coreDbPath = ':memory:';
    }

    const userDbPath = path.join(process.env.HOME || '~', '.katasumi', 'user-data.db');
    debugLog(`User database path: ${userDbPath}`);
    dbAdapter = new SQLiteAdapter(coreDbPath, userDbPath);
    debugLog('SQLiteAdapter initialized');
  }
  return dbAdapter;
}
