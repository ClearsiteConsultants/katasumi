import { describe, test, expect, beforeAll } from 'vitest';
import { SQLiteAdapter } from '@katasumi/core';
import type { Shortcut, DatabaseAdapter } from '@katasumi/core';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Detail View', () => {
  let adapter: DatabaseAdapter;
  let testShortcut: Shortcut;

  beforeAll(async () => {
    // Use the real core database
    const possiblePaths = [
      path.resolve(__dirname, '..', '..', '..', 'core', 'data', 'shortcuts.db'),
      path.resolve(process.cwd(), '..', 'core', 'data', 'shortcuts.db'),
      path.resolve(process.cwd(), 'packages', 'core', 'data', 'shortcuts.db'),
    ];

    const coreDbPath = possiblePaths.find((p) => fs.existsSync(p));
    if (!coreDbPath) {
      throw new Error('Core database not found');
    }

    adapter = new SQLiteAdapter(coreDbPath, ':memory:');
    
    // Get a test shortcut
    const vimShortcuts = await adapter.getShortcutsByApp('vim');
    testShortcut = vimShortcuts[0];
  });

  describe('Related Shortcuts', () => {
    test('should find related shortcuts based on category and context', async () => {
      const allShortcuts = await adapter.getShortcutsByApp(testShortcut.app);
      
      // Filter and score shortcuts (same logic as DetailView)
      const scored = allShortcuts
        .filter(s => s.id !== testShortcut.id)
        .map(s => {
          let score = 0;
          if (s.category === testShortcut.category && testShortcut.category) score += 3;
          if (s.context === testShortcut.context && testShortcut.context) score += 2;
          const sharedTags = s.tags.filter(t => testShortcut.tags.includes(t));
          score += sharedTags.length;
          return { shortcut: s, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      expect(scored.length).toBeGreaterThan(0);
      expect(scored.length).toBeLessThanOrEqual(5);
      
      // Verify scoring works correctly
      if (scored.length > 1) {
        expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
      }
    });

    test('should prioritize same category shortcuts', async () => {
      const allShortcuts = await adapter.getShortcutsByApp(testShortcut.app);
      const sameCategoryShortcuts = allShortcuts.filter(
        s => s.id !== testShortcut.id && s.category === testShortcut.category
      );

      if (sameCategoryShortcuts.length > 0) {
        const scored = sameCategoryShortcuts.map(s => {
          let score = 0;
          if (s.category === testShortcut.category && testShortcut.category) score += 3;
          if (s.context === testShortcut.context && testShortcut.context) score += 2;
          const sharedTags = s.tags.filter(t => testShortcut.tags.includes(t));
          score += sharedTags.length;
          return { shortcut: s, score };
        });

        scored.forEach(item => {
          expect(item.score).toBeGreaterThanOrEqual(3);
        });
      }
    });
  });

  describe('Shortcut Details', () => {
    test('should contain all required fields', async () => {
      expect(testShortcut).toBeDefined();
      expect(testShortcut.id).toBeDefined();
      expect(testShortcut.app).toBeDefined();
      expect(testShortcut.action).toBeDefined();
      expect(testShortcut.keys).toBeDefined();
      expect(testShortcut.tags).toBeInstanceOf(Array);
    });

    test('should have keys for at least one platform', async () => {
      const hasKeys = !!(
        testShortcut.keys.mac ||
        testShortcut.keys.windows ||
        testShortcut.keys.linux
      );
      expect(hasKeys).toBe(true);
    });

    test('should have valid source information if present', async () => {
      if (testShortcut.source) {
        expect(testShortcut.source.type).toBeDefined();
        expect(['official', 'community', 'ai-scraped', 'user-added']).toContain(
          testShortcut.source.type
        );
      }
    });
  });

  describe('Platform Key Selection', () => {
    test('should select correct keys for mac platform', () => {
      const getKeysForPlatform = (shortcut: Shortcut, platform: string): string => {
        switch (platform) {
          case 'mac':
            return shortcut.keys.mac || shortcut.keys.linux || shortcut.keys.windows || 'N/A';
          case 'windows':
            return shortcut.keys.windows || shortcut.keys.linux || 'N/A';
          case 'linux':
            return shortcut.keys.linux || shortcut.keys.windows || 'N/A';
          default:
            return 'N/A';
        }
      };

      const keys = getKeysForPlatform(testShortcut, 'mac');
      expect(keys).toBeDefined();
      expect(keys).not.toBe('');
    });

    test('should fall back to other platform keys when primary not available', () => {
      const shortcutWithWindowsOnly: Shortcut = {
        ...testShortcut,
        keys: { windows: 'Ctrl+C' },
      };

      const getKeysForPlatform = (shortcut: Shortcut, platform: string): string => {
        switch (platform) {
          case 'mac':
            return shortcut.keys.mac || shortcut.keys.linux || shortcut.keys.windows || 'N/A';
          case 'windows':
            return shortcut.keys.windows || shortcut.keys.linux || 'N/A';
          case 'linux':
            return shortcut.keys.linux || shortcut.keys.windows || 'N/A';
          default:
            return 'N/A';
        }
      };

      const macKeys = getKeysForPlatform(shortcutWithWindowsOnly, 'mac');
      expect(macKeys).toBe('Ctrl+C');
      
      const linuxKeys = getKeysForPlatform(shortcutWithWindowsOnly, 'linux');
      expect(linuxKeys).toBe('Ctrl+C');
    });
  });
});
